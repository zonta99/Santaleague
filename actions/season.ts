"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { SeasonSchema } from "@/schemas";
import { getLeaderboard } from "@/data/stats";
import { awardSeasonBadges } from "@/actions/badges";

export const createSeason = async (values: z.infer<typeof SeasonSchema>) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageSeasons")) return { error: "Non autorizzato" };

  const parsed = SeasonSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { name, start_date, end_date } = parsed.data;

  try {
    await db.season.create({
      data: {
        name,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status: "ACTIVE",
      },
    });
  } catch {
    return { error: "Nome stagione già esistente" };
  }

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { success: "Stagione creata" };
};

export const updateSeason = async (id: number, values: z.infer<typeof SeasonSchema>) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageSeasons")) return { error: "Non autorizzato" };

  const parsed = SeasonSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { name, start_date, end_date } = parsed.data;

  try {
    await db.season.update({
      where: { id },
      data: { name, start_date: new Date(start_date), end_date: new Date(end_date) },
    });
  } catch {
    return { error: "Nome stagione già esistente" };
  }

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  return { success: "Stagione aggiornata" };
};

export const closeSeason = async (id: number) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageSeasons")) return { error: "Non autorizzato" };

  const season = await db.season.findUnique({ where: { id } });
  if (!season) return { error: "Stagione non trovata" };
  if (season.status === "COMPLETED") return { error: "Stagione già chiusa" };

  const leaderboard = await getLeaderboard(id);
  const champion_id = leaderboard[0]?.user?.id ?? null;

  await db.season.update({
    where: { id },
    data: { status: "COMPLETED", champion_id },
  });

  await awardSeasonBadges(id);

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath(`/season/${id}`);
  return { success: "Stagione chiusa" };
};
