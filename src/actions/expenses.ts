"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  sharedExpenses,
  expenseSplits,
  groupMembers,
  transactions,
  wallets,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ==============================================================================
// ESQUEMAS DE VALIDACIÓN ZOD
// ==============================================================================

const SplitItemSchema = z.object({
  userId: z.string().min(1, "El ID del participante es obligatorio"),
  owedAmount: z.number().min(0, "El monto debe ser mayor o igual a 0"),
  percentage: z.number().min(0).max(100).optional(),
  shares: z.number().int().min(1).optional(),
});

export const CreateSharedExpenseSchema = z.object({
  groupId: z.string().uuid("ID de grupo inválido"),
  description: z.string().trim().min(1, "La descripción es requerida").max(255),
  totalAmount: z.number().positive("El monto total debe ser mayor a 0"),
  currency: z.string().length(3, "Código de moneda ISO inválido (ej: CLP, USD)").toUpperCase(),
  exchangeRateAtCreated: z.number().positive().default(1.0),
  paidById: z.string().min(1, "El pagador es obligatorio"),
  splitType: z.enum(["equal", "exact", "percentage", "shares"]).default("equal"),
  splits: z.array(SplitItemSchema).min(1, "Debe haber al menos un participante"),
  categoryId: z.string().uuid().optional(),
  receiptUrl: z.string().url().optional(),
  // Si el pagador desea descontar automáticamente el gasto de una de sus billeteras privadas
  syncPayerWalletId: z.string().uuid().optional(),
});

export type CreateSharedExpenseInput = z.infer<typeof CreateSharedExpenseSchema>;

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ==============================================================================
// SERVER ACTION: REGISTRAR GASTO COMPARTIDO
// ==============================================================================

export async function createSharedExpenseAction(
  rawInput: CreateSharedExpenseInput
): Promise<ActionResponse<{ expenseId: string }>> {
  try {
    // 1. Verificación de Autenticación
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicia sesión para continuar." };
    }

    // 2. Validación de Entrada
    const parsed = CreateSharedExpenseSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const input = parsed.data;

    // 3. Verificación de Seguridad y Aislamiento de Grupo:
    // Asegurar que el usuario autenticado y todos los miembros del gasto pertenecen al grupo
    const groupMemberRecords = await db
      .select({ userId: groupMembers.userId, netBalance: groupMembers.netBalance })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, input.groupId));

    const memberMap = new Map(groupMemberRecords.map((m) => [m.userId, m]));

    // Verificar que el usuario que ejecuta la acción es miembro
    if (!memberMap.has(session.user.id)) {
      return {
        success: false,
        error: "Acceso denegado: no perteneces a este grupo.",
      };
    }

    // Verificar que el pagador pertenece al grupo
    if (!memberMap.has(input.paidById)) {
      return {
        success: false,
        error: "El usuario que pagó no es miembro del grupo.",
      };
    }

    // Verificar que todos los involucrados en la división son miembros
    for (const split of input.splits) {
      if (!memberMap.has(split.userId)) {
        return {
          success: false,
          error: `El usuario participante (${split.userId}) no pertenece a este grupo.`,
        };
      }
    }

    // 4. Validación de Consistencia de Montos (Suma de splits == totalAmount)
    const sumSplits = input.splits.reduce((acc, curr) => acc + curr.owedAmount, 0);
    const difference = Math.abs(sumSplits - input.totalAmount);
    if (difference > 0.05) {
      return {
        success: false,
        error: `La suma de las partes ($${sumSplits.toFixed(2)}) no coincide con el total ($${input.totalAmount.toFixed(2)}).`,
      };
    }

    // 5. Inserción del Gasto Compartido
    const [newExpense] = await db
      .insert(sharedExpenses)
      .values({
        groupId: input.groupId,
        paidById: input.paidById,
        description: input.description,
        totalAmount: input.totalAmount.toFixed(2),
        currency: input.currency,
        exchangeRateAtCreated: input.exchangeRateAtCreated.toFixed(6),
        splitType: input.splitType,
        categoryId: input.categoryId || null,
        receiptUrl: input.receiptUrl || null,
      })
      .returning({ id: sharedExpenses.id });

    // 6. Inserción de Divisiones (Expense Splits)
    const splitsToInsert = input.splits.map((s) => ({
      sharedExpenseId: newExpense.id,
      userId: s.userId,
      owedAmount: s.owedAmount.toFixed(2),
      percentage: s.percentage ? s.percentage.toFixed(2) : null,
      shares: s.shares ?? 1,
    }));

    await db.insert(expenseSplits).values(splitsToInsert);

    // 7. Actualización de Saldos Netos en el Grupo (netBalance)
    // El pagador recibe un crédito neto: +(Total Pagado - Lo que le correspondía a sí mismo)
    // Los deudores reciben un débito neto: -(Su porción adeudada)
    const payerSplit = input.splits.find((s) => s.userId === input.paidById);
    const payerOwed = payerSplit ? payerSplit.owedAmount : 0;
    const payerNetIncrease = input.totalAmount - payerOwed;

    // Actualizar balance del pagador
    if (payerNetIncrease !== 0) {
      await db
        .update(groupMembers)
        .set({
          netBalance: sql`${groupMembers.netBalance} + ${payerNetIncrease.toFixed(2)}::numeric`,
        })
        .where(
          and(
            eq(groupMembers.groupId, input.groupId),
            eq(groupMembers.userId, input.paidById)
          )
        );
    }

    // Actualizar balance de los otros participantes
    for (const split of input.splits) {
      if (split.userId === input.paidById) continue; // Ya contemplado en payerNetIncrease
      if (split.owedAmount > 0) {
        await db
          .update(groupMembers)
          .set({
            netBalance: sql`${groupMembers.netBalance} - ${split.owedAmount.toFixed(2)}::numeric`,
          })
          .where(
            and(
              eq(groupMembers.groupId, input.groupId),
              eq(groupMembers.userId, split.userId)
            )
          );
      }
    }

    // 8. Opcional: Descontar de Billetera Personal del Pagador (si se seleccionó sincronizar)
    if (input.syncPayerWalletId && input.paidById === session.user.id) {
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(
          and(
            eq(wallets.id, input.syncPayerWalletId),
            eq(wallets.userId, session.user.id)
          )
        );

      if (wallet) {
        // Registrar transacción personal reflejando el desembolso total de dinero
        await db.insert(transactions).values({
          userId: session.user.id,
          walletId: input.syncPayerWalletId,
          categoryId: input.categoryId || null,
          type: "expense",
          amount: input.totalAmount.toFixed(2),
          currency: input.currency,
          exchangeRateAtCreated: input.exchangeRateAtCreated.toFixed(6),
          notes: `[Gasto Compartido]: ${input.description}`,
          sharedExpenseId: newExpense.id,
        });

        // Actualizar saldo de la billetera
        await db
          .update(wallets)
          .set({
            currentBalance: sql`${wallets.currentBalance} - ${input.totalAmount.toFixed(2)}::numeric`,
          })
          .where(eq(wallets.id, input.syncPayerWalletId));
      }
    }

    // 9. Revalidación de Caché en Next.js
    revalidatePath(`/groups/${input.groupId}`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      data: { expenseId: newExpense.id },
    };
  } catch (error) {
    console.error("[createSharedExpenseAction Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado en el servidor.",
    };
  }
}
