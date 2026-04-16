"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { LocationSchema } from "@/schemas";

export const createLocation = async (values: z.infer<typeof LocationSchema>) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  const parsed = LocationSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  try {
    await db.location.create({ data: parsed.data });
  } catch {
    return { error: "Nome già esistente" };
  }

  revalidatePath("/admin");
  return { success: "Campo creato" };
};

export const updateLocation = async (id: number, values: z.infer<typeof LocationSchema>) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  const parsed = LocationSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  try {
    await db.location.update({ where: { id }, data: parsed.data });
  } catch {
    return { error: "Nome già esistente" };
  }

  revalidatePath("/admin");
  return { success: "Campo aggiornato" };
};

export const deleteLocation = async (id: number) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  const count = await db.match.count({ where: { location_id: id } });
  if (count > 0) return { error: "Campo in uso da una o più partite" };

  await db.location.delete({ where: { id } });

  revalidatePath("/admin");
  return { success: "Campo eliminato" };
};
