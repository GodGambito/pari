"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { wallets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateWalletSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  type: z.enum(["cash", "bank", "credit_card", "savings", "other"]).default("cash"),
  currency: z.string().length(3).toUpperCase().default("CLP"),
  initialBalance: z.coerce.number().default(0),
  color: z.string().default("#10B981"),
  icon: z.string().default("Wallet"),
});

export type CreateWalletInput = z.infer<typeof CreateWalletSchema>;

export async function createWalletAction(rawInput: CreateWalletInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicia sesión para continuar." };
    }

    const parsed = CreateWalletSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const data = parsed.data;

    // Verificar si el usuario ya tiene alguna billetera para marcarla como default si es la primera
    const existing = await db
      .select({ id: wallets.id })
      .from(wallets)
      .where(eq(wallets.userId, session.user.id));

    const isFirst = existing.length === 0;

    const [newWallet] = await db
      .insert(wallets)
      .values({
        userId: session.user.id,
        name: data.name,
        type: data.type,
        currency: data.currency,
        initialBalance: data.initialBalance.toFixed(2),
        currentBalance: data.initialBalance.toFixed(2),
        color: data.color,
        icon: data.icon,
        isDefault: isFirst,
      })
      .returning({ id: wallets.id });

    revalidatePath("/");
    revalidatePath("/wallets");
    revalidatePath("/dashboard");

    return { success: true, data: { walletId: newWallet.id } };
  } catch (error) {
    console.error("[createWalletAction Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear la billetera.",
    };
  }
}
