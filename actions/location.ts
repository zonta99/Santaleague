"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { canPerformLeagueAction } from "@/lib/league-auth";
import { LocationSchema } from "@/schemas";

export const createLocation = async (values: z.infer<typeof LocationSchema>, leagueId: string) => {
  const allowed = await canPerformLeagueAction(leagueId, "manageLocations");
  if (!allowed) return { error: "Non autorizzato" };

  const parsed = LocationSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  try {
    await db.location.create({
      data: { name: parsed.data.name, description: parsed.data.description, num_fields: parsed.data.num_fields ?? 1, league_id: leagueId },
    });
  } catch {
    return { error: "Nome già esistente" };
  }

  revalidatePath("/admin");
  return { success: "Campo creato" };
};

export const updateLocation = async (id: number, values: z.infer<typeof LocationSchema>, leagueId: string) => {
  const allowed = await canPerformLeagueAction(leagueId, "manageLocations");
  if (!allowed) return { error: "Non autorizzato" };

  const parsed = LocationSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  try {
    await db.location.update({
      where: { id },
      data: { name: parsed.data.name, description: parsed.data.description, num_fields: parsed.data.num_fields ?? 1 },
    });
  } catch {
    return { error: "Nome già esistente" };
  }

  revalidatePath("/admin");
  return { success: "Campo aggiornato" };
};

export const deleteLocation = async (id: number, leagueId: string) => {
  const allowed = await canPerformLeagueAction(leagueId, "manageLocations");
  if (!allowed) return { error: "Non autorizzato" };

  const count = await db.match.count({ where: { location_id: id } });
  if (count > 0) return { error: "Campo in uso da una o più partite" };

  await db.location.delete({ where: { id } });

  revalidatePath("/admin");
  return { success: "Campo eliminato" };
};
