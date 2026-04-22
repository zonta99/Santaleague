"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canPerformLeagueAction } from "@/lib/league-auth";
import { getLeagueMember } from "@/data/league";
import { RatingRole } from "@prisma/client";
import { checkCareerBadgesForPlayer } from "@/actions/badges";
import * as z from "zod";

const RatingEntrySchema = z.object({
  rated_player_id: z.string(),
  score: z.number().int().min(1).max(10),
  role: z.nativeEnum(RatingRole),
});

export const submitRatings = async (
  matchId: number,
  ratings: z.infer<typeof RatingEntrySchema>[]
) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { rating_open: true, rating_opened_at: true, Season: { select: { league_id: true } } },
  });
  if (!match) return { error: "Match non trovato" };
  if (!match.rating_open) return { error: "La finestra di valutazione è chiusa" };

  if (match.rating_opened_at) {
    const diff = Date.now() - new Date(match.rating_opened_at).getTime();
    if (diff > 48 * 60 * 60 * 1000) return { error: "Finestra di valutazione scaduta" };
  }

  if (match.Season?.league_id) {
    const member = await getLeagueMember(match.Season.league_id, user.id);
    if (!member) return { error: "Non sei membro di questa lega" };
  }

  const isParticipant = await db.matchParticipant.findUnique({
    where: { match_id_user_id: { match_id: matchId, user_id: user.id } },
  });
  if (!isParticipant) return { error: "Non sei un partecipante di questa partita" };

  const parsed = z.array(RatingEntrySchema).safeParse(ratings);
  if (!parsed.success) return { error: "Dati non validi" };

  const filtered = parsed.data.filter((r) => r.rated_player_id !== user.id);

  for (const r of filtered) {
    await db.matchRating.upsert({
      where: {
        match_id_rater_id_rated_player_id_role: {
          match_id: matchId,
          rater_id: user.id!,
          rated_player_id: r.rated_player_id,
          role: r.role,
        },
      },
      create: {
        match_id: matchId,
        rater_id: user.id!,
        rated_player_id: r.rated_player_id,
        score: r.score,
        role: r.role,
      },
      update: { score: r.score },
    });
  }

  const leagueId = match.Season?.league_id ?? "";
  const ratedPlayerIds = Array.from(new Set(filtered.map((r) => r.rated_player_id)));
  await Promise.all(ratedPlayerIds.map((id) => checkCareerBadgesForPlayer(id, leagueId)));

  revalidatePath(`/match/${matchId}/rate`);
  revalidatePath(`/match/${matchId}`);
  revalidatePath("/dashboard");
  return { success: "Valutazioni inviate" };
};

export const openRatingWindow = async (matchId: number) => {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { Season: { select: { league_id: true } } },
  });
  if (!match) return { error: "Partita non trovata" };

  const leagueId = match.Season?.league_id ?? "";
  const allowed = await canPerformLeagueAction(leagueId, "manageGameEvents");
  if (!allowed) return { error: "Non autorizzato" };

  await db.match.update({
    where: { id: matchId },
    data: { rating_open: true, rating_opened_at: new Date() },
  });

  revalidatePath(`/match/${matchId}`);
  return { success: "Finestra di valutazione aperta" };
};

/**
 * Computes MVP from combined FIELD+GK ratings (70%) + goals (30%) and saves mvp_id.
 * Safe to call concurrently: skips silently if mvp_id is already set.
 */
export const computeAndSetMvp = async (matchId: number) => {
  // Guard against concurrent execution: skip if MVP already assigned
  const existing = await db.match.findUnique({ where: { id: matchId }, select: { mvp_id: true } });
  if (existing?.mvp_id) return;

  const [ratings, gameDetails] = await Promise.all([
    db.matchRating.findMany({
      where: { match_id: matchId },
      select: { rated_player_id: true, score: true, role: true },
    }),
    db.gameDetail.findMany({
      where: { Match: { id: matchId }, event_type: "Goal" },
      select: { player_id: true },
    }),
  ]);

  if (ratings.length === 0) return;

  // Aggregate ratings per player per role, then average the two roles
  const byPlayer = new Map<string, { field: number[]; gk: number[] }>();
  for (const r of ratings) {
    let entry = byPlayer.get(r.rated_player_id);
    if (!entry) { entry = { field: [], gk: [] }; byPlayer.set(r.rated_player_id, entry); }
    if (r.role === RatingRole.FIELD) entry.field.push(r.score);
    else entry.gk.push(r.score);
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

  const ratingMap = new Map<string, number>();
  for (const [userId, { field, gk }] of byPlayer) {
    const avgField = avg(field);
    const avgGk = avg(gk);
    const combined =
      avgField !== null && avgGk !== null ? (avgField + avgGk) / 2
      : avgField ?? avgGk!;
    ratingMap.set(userId, combined);
  }

  // Aggregate goals per player
  const goalMap = new Map<string, number>();
  for (const d of gameDetails) {
    if (d.player_id) goalMap.set(d.player_id, (goalMap.get(d.player_id) ?? 0) + 1);
  }

  const maxGoals = Math.max(1, ...goalMap.values());

  // Score = avg_combined_rating * 0.7 + (goals / maxGoals) * 10 * 0.3
  const scores = Array.from(ratingMap.entries()).map(([userId, avgRating]) => {
    const goals = goalMap.get(userId) ?? 0;
    const score = avgRating * 0.7 + (goals / maxGoals) * 10 * 0.3;
    return { userId, score };
  });

  const mvp = scores.sort((a, b) => b.score - a.score)[0];
  if (!mvp) return;

  await db.match.update({ where: { id: matchId }, data: { mvp_id: mvp.userId } });
};

/**
 * Called server-side after rating window expires (no auth needed — only triggers after 48h).
 * Idempotent: skips if MVP already set or window not yet expired.
 */
export const autoComputeMvpIfExpired = async (matchId: number) => {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { status: true, mvp_id: true, rating_opened_at: true },
  });
  if (!match) return;
  if (match.status !== "COMPLETED") return;
  if (match.mvp_id) return;
  if (!match.rating_opened_at) return;
  if (Date.now() - new Date(match.rating_opened_at).getTime() <= 48 * 60 * 60 * 1000) return;

  await computeAndSetMvp(matchId);
  await db.match.update({ where: { id: matchId }, data: { rating_open: false } });
};

export const closeRatingWindow = async (matchId: number) => {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { Season: { select: { league_id: true } } },
  });
  if (!match) return { error: "Partita non trovata" };

  const leagueId = match.Season?.league_id ?? "";
  const allowed = await canPerformLeagueAction(leagueId, "manageGameEvents");
  if (!allowed) return { error: "Non autorizzato" };

  await computeAndSetMvp(matchId);

  await db.match.update({
    where: { id: matchId },
    data: { rating_open: false },
  });

  revalidatePath(`/match/${matchId}`);
  return { success: "Finestra di valutazione chiusa" };
};
