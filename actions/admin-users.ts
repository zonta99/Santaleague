"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser, currentRole } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export const updateUserRole = async (userId: string, newRole: UserRole) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageUsers")) return { error: "Non autorizzato" };

  const me = await currentUser();
  if (me?.id === userId) return { error: "Non puoi modificare il tuo ruolo" };

  await db.user.update({ where: { id: userId }, data: { role: newRole } });

  revalidatePath("/admin/users");
  return { success: "Ruolo aggiornato" };
};
