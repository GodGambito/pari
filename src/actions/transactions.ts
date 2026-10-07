"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { transactions, wallets } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TransactionSchema = z.object({
  walletId: z.string().uuid("Billetera inválida"),
  destinationWalletId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(["expense", "income", "transfer"]).default("expense"),
  amount: z.coerce.number().positive("El monto debe ser positivo"),
  currency: z.string().length(3).toUpperCase().default("CLP"),
  exchangeRateAtCreated: z.coerce.number().positive().default(1.0),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().max(500).optional(),
  attachments: z.array(z.string().url()).optional(),
});

export type TransactionInput = z.input<typeof TransactionSchema>;

export async function createPersonalTransactionAction(rawInput: TransactionInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicia sesión para continuar." };
    }

    const parsed = TransactionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const data = parsed.data;

    // Verificar que la billetera pertenece al usuario autenticado
    const [userWallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, data.walletId), eq(wallets.userId, session.user.id)));

    if (!userWallet) {
      return { success: false, error: "Billetera no encontrada o no autorizada." };
    }

    // Insertar la transacción
    const [newTx] = await db
      .insert(transactions)
      .values({
        userId: session.user.id,
        walletId: data.walletId,
        destinationWalletId: data.destinationWalletId || null,
        categoryId: data.categoryId || null,
        type: data.type,
        amount: data.amount.toFixed(2),
        currency: data.currency,
        exchangeRateAtCreated: data.exchangeRateAtCreated.toFixed(6),
        date: data.date,
        notes: data.notes || null,
        attachments: data.attachments || null,
      })
      .returning({ id: transactions.id });

    // Actualizar balances según tipo
    if (data.type === "expense") {
      await db
        .update(wallets)
        .set({
          currentBalance: sql`${wallets.currentBalance} - ${data.amount.toFixed(2)}::numeric`,
        })
        .where(eq(wallets.id, data.walletId));
    } else if (data.type === "income") {
      await db
        .update(wallets)
        .set({
          currentBalance: sql`${wallets.currentBalance} + ${data.amount.toFixed(2)}::numeric`,
        })
        .where(eq(wallets.id, data.walletId));
    } else if (data.type === "transfer" && data.destinationWalletId) {
      // Descontar de origen
      await db
        .update(wallets)
        .set({
          currentBalance: sql`${wallets.currentBalance} - ${data.amount.toFixed(2)}::numeric`,
        })
        .where(eq(wallets.id, data.walletId));

      // Abonar a destino
      await db
        .update(wallets)
        .set({
          currentBalance: sql`${wallets.currentBalance} + ${data.amount.toFixed(2)}::numeric`,
        })
        .where(
          and(
            eq(wallets.id, data.destinationWalletId),
            eq(wallets.userId, session.user.id)
          )
        );
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/wallets");

    return { success: true, data: { transactionId: newTx.id } };
  } catch (error) {
    console.error("[createPersonalTransactionAction Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error del servidor.",
    };
  }
}

export async function createBatchTransactionsAction(
  items: TransactionInput[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado." };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "No se enviaron transacciones para guardar." };
    }

    for (const item of items) {
      const res = await createPersonalTransactionAction(item);
      if (!res.success) {
        return { success: false, error: res.error || "Error al procesar una transacción." };
      }
    }

    revalidatePath("/");
    return { success: true, message: `${items.length} transacciones registradas.` };
  } catch (error) {
    console.error("[createBatchTransactionsAction Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al guardar movimientos.",
    };
  }
}
