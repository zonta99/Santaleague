"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { canPerformLeagueAction } from "@/lib/league-auth";
import { SeasonSchema } from "@/schemas";
import { getLeaderboard } from "@/data/stats";
import { awardSeasonBadges } from "@/actions/badges";

export const createSeason = async (values: z.infer<typeof SeasonSchema>, leagueId: string) => {
  const allowed = await canPerformLeagueAction(leagueId, "manageSeasons");
  if (!allowed) return { error: "Non autorizzato" };

  const parsed = SeasonSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { name, start_date, end_date } = parsed.data;

  const activeSeason = await db.season.findFirst({ where: { league_id: leagueId, status: "ACTIVE" } });
  if (activeSeason) return { error: "Esiste già una stagione attiva. Chiudila prima di crearne una nuova." };

  try {
    await db.season.create({
      data: {
        name,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        status: "ACTIVE",
        league_id: leagueId,
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
  const season = await db.season.findUnique({ where: { id }, select: { league_id: true } });
  if (!season) return { error: "Stagione non trovata" };

  const allowed = await canPerformLeagueAction(season.league_id, "manageSeasons");
  if (!allowed) return { error: "Non autorizzato" };

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
  const season = await db.season.findUnique({ where: { id } });
  if (!season) return { error: "Stagione non trovata" };
  if (season.status === "COMPLETED") return { error: "Stagione già chiusa" };

  const allowed = await canPerformLeagueAction(season.league_id, "manageSeasons");
  if (!allowed) return { error: "Non autorizzato" };

  const leaderboard = await getLeaderboard(season.league_id, id);
  const champion_id = leaderboard[0]?.user?.id ?? null;

  // Award badges before closing so idempotency check (season.status === "COMPLETED") doesn't block retries
  await awardSeasonBadges(id, season.league_id);

  // Close the season atomically — if this fails after badge award, awardSeasonBadges is idempotent
  await db.season.update({
    where: { id, status: "ACTIVE" },
    data: { status: "COMPLETED", champion_id },
  });

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath(`/season/${id}`);
  return { success: "Stagione chiusa" };
};

export const reopenSeason = async (id: number) => {
  const season = await db.season.findUnique({ where: { id } });
  if (!season) return { error: "Stagione non trovata" };
  if (season.status === "ACTIVE") return { error: "Stagione già attiva" };

  const allowed = await canPerformLeagueAction(season.league_id, "manageSeasons");
  if (!allowed) return { error: "Non autorizzato" };

  const activeSeason = await db.season.findFirst({
    where: { league_id: season.league_id, status: "ACTIVE" },
  });
  if (activeSeason) return { error: "Esiste già una stagione attiva. Chiudila prima di riaprirne un'altra." };

  await db.$transaction([
    db.userBadge.deleteMany({ where: { season_id: id } }),
    db.season.update({
      where: { id },
      data: { status: "ACTIVE", champion_id: null },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
  revalidatePath(`/season/${id}`);
  return { success: "Stagione riaperta" };
};
