"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { groups, groupMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateGroupSchema = z.object({
  name: z.string().trim().min(1, "El nombre del grupo es obligatorio").max(120),
  description: z.string().max(500).optional(),
  baseCurrency: z.string().length(3).toUpperCase().default("CLP"),
});

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>;

export async function createGroupAction(rawInput: CreateGroupInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado. Inicia sesión para continuar." };
    }

    const parsed = CreateGroupSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(", "),
      };
    }

    const data = parsed.data;
    const inviteCode = crypto.randomUUID().slice(0, 8).toUpperCase();

    // 1. Crear el grupo
    const [newGroup] = await db
      .insert(groups)
      .values({
        name: data.name,
        description: data.description || null,
        baseCurrency: data.baseCurrency,
        inviteCode: inviteCode,
        createdById: session.user.id,
      })
      .returning({ id: groups.id, inviteCode: groups.inviteCode });

    // 2. Asociar al creador como miembro administrador
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: session.user.id,
      role: "admin",
      netBalance: "0.00",
    });

    revalidatePath("/");
    revalidatePath("/groups");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { groupId: newGroup.id, inviteCode: newGroup.inviteCode },
    };
  } catch (error) {
    console.error("[createGroupAction Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear el grupo.",
    };
  }
}

export async function joinGroupByCodeAction(inviteCode: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado." };
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    const [targetGroup] = await db
      .select()
      .from(groups)
      .where(eq(groups.inviteCode, cleanCode))
      .limit(1);

    if (!targetGroup) {
      return { success: false, error: "Código de invitación no válido o inexistente." };
    }

    // Verificar si ya es miembro
    const [existingMember] = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, targetGroup.id),
          eq(groupMembers.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingMember) {
      return {
        success: true,
        message: "Ya eres miembro de este grupo.",
        data: { groupId: targetGroup.id },
      };
    }

    // Unirse al grupo
    await db.insert(groupMembers).values({
      groupId: targetGroup.id,
      userId: session.user.id,
      role: "member",
      netBalance: "0.00",
    });

    revalidatePath("/");
    revalidatePath("/groups");
    revalidatePath(`/groups/${targetGroup.id}`);

    return {
      success: true,
      data: { groupId: targetGroup.id, groupName: targetGroup.name },
    };
  } catch (error) {
    console.error("[joinGroupByCodeAction Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al unirse al grupo.",
    };
  }
}
