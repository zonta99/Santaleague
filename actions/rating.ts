"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentUser, currentRole } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
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

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Match non trovato" };
  if (!match.rating_open) return { error: "La finestra di valutazione è chiusa" };

  if (match.rating_opened_at) {
    const diff = Date.now() - new Date(match.rating_opened_at).getTime();
    if (diff > 48 * 60 * 60 * 1000) return { error: "Finestra di valutazione scaduta" };
  }

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

  const ratedPlayerIds = Array.from(new Set(filtered.map((r) => r.rated_player_id)));
  await Promise.all(ratedPlayerIds.map((id) => checkCareerBadgesForPlayer(id)));

  revalidatePath(`/match/${matchId}/rate`);
  revalidatePath(`/match/${matchId}`);
  revalidatePath("/dashboard");
  return { success: "Valutazioni inviate" };
};

export const openRatingWindow = async (matchId: number) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageGameEvents")) return { error: "Non autorizzato" };

  await db.match.update({
    where: { id: matchId },
    data: { rating_open: true, rating_opened_at: new Date() },
  });

  revalidatePath(`/match/${matchId}`);
  return { success: "Finestra di valutazione aperta" };
};

export const closeRatingWindow = async (matchId: number) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageGameEvents")) return { error: "Non autorizzato" };

  await db.match.update({
    where: { id: matchId },
    data: { rating_open: false },
  });

  revalidatePath(`/match/${matchId}`);
  return { success: "Finestra di valutazione chiusa" };
};
