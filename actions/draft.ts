"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getPlayerLevel } from "@/data/stats";
import { snakeDraft, balanceDelta, teamStrength } from "@/lib/draft-algorithm";

const TEAM_NAMES = ["Bianchi", "Neri", "Verdi", "Rossi", "Blu", "Gialli"];

export const executeDraft = async (matchId: number) => {
  const role = await currentRole();
  if (!hasPermission(role, "executeDraft")) return { error: "Non autorizzato" };

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { MatchParticipant: true, Game: { orderBy: { game_number: "asc" } } },
  });

  if (!match) return { error: "Partita non trovata" };
  if (match.draft_locked) return { error: "Draft bloccato" };
  if (match.MatchParticipant.length < 2) return { error: "Servono almeno 2 partecipanti" };

  // Clean up any existing unlocked draft
  const existingPicks = await db.draftPick.findMany({ where: { match_id: matchId }, select: { team_id: true } });
  if (existingPicks.length > 0) {
    const existingTeamIds = Array.from(new Set(existingPicks.map((p) => p.team_id)));
    await db.draftPick.deleteMany({ where: { match_id: matchId } });
    await db.game.updateMany({ where: { match_id: matchId }, data: { team1_id: null, team2_id: null } });
    await db.teamMember.deleteMany({ where: { team_id: { in: existingTeamIds } } });
    await db.team.deleteMany({ where: { id: { in: existingTeamIds } } });
  }

  const numTeams = match.num_teams ?? 2;
  const teamNames = TEAM_NAMES.slice(0, numTeams);

  const matchDate = new Date(match.date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });

  // Fetch level for each participant
  const participantsWithLevel = await Promise.all(
    match.MatchParticipant.map(async (p) => {
      const { level } = await getPlayerLevel(p.user_id, match.season_id ?? undefined);
      return { userId: p.user_id, level };
    })
  );

  const buckets = snakeDraft(participantsWithLevel, numTeams);

  // Create teams
  const teams = await Promise.all(
    teamNames.map((name) => db.team.create({ data: { name: `${matchDate} - ${name}`, team_type: null } }))
  );

  // Create draft picks with strength_at_draft
  await db.draftPick.createMany({
    data: buckets.flatMap((bucket, teamIdx) =>
      bucket.map((player, pickIdx) => ({
        match_id: matchId,
        team_id: teams[teamIdx].id,
        user_id: player.userId,
        pick_order: pickIdx + 1,
        strength_at_draft: player.level,
      }))
    ),
  });

  // Assign teams to games via round-robin pairing (cycles through all unique pairs)
  const gamePairs: [number, number][] = [];
  for (let i = 0; i < numTeams - 1; i++)
    for (let j = i + 1; j < numTeams; j++)
      gamePairs.push([i, j]);

  for (let i = 0; i < match.Game.length; i++) {
    const [a, b] = gamePairs[i % gamePairs.length];
    await db.game.update({
      where: { id: match.Game[i].id },
      data: { team1_id: teams[a].id, team2_id: teams[b].id },
    });
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/match/${matchId}/draft`);
  return { success: "Draft completato" };
};

export const lockDraft = async (matchId: number) => {
  const role = await currentRole();
  if (!hasPermission(role, "executeDraft")) return { error: "Non autorizzato" };

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partita non trovata" };
  if (match.draft_locked) return { error: "Draft già bloccato" };

  const picks = await db.draftPick.findMany({
    where: { match_id: matchId },
    orderBy: { pick_order: "asc" },
  });
  if (picks.length === 0) return { error: "Esegui il draft prima di bloccarlo" };

  // Group picks by team
  const teamPicksMap = new Map<number, typeof picks>();
  for (const pick of picks) {
    if (!teamPicksMap.has(pick.team_id)) teamPicksMap.set(pick.team_id, []);
    teamPicksMap.get(pick.team_id)!.push(pick);
  }

  const buckets = Array.from(teamPicksMap.values()).map((teamPicks) =>
    teamPicks.map((p) => ({ userId: p.user_id, level: p.strength_at_draft ?? 0 }))
  );
  const balanceScore = balanceDelta(buckets);

  // Create TeamMember records; existing captains (from setCaptain calls) are preserved via upsert
  for (const [teamId, teamPicks] of Array.from(teamPicksMap.entries())) {
    const existingCaptain = await db.teamMember.findFirst({ where: { team_id: teamId, is_captain: true } });
    for (let i = 0; i < teamPicks.length; i++) {
      const pick = teamPicks[i];
      const isCaptain = existingCaptain ? existingCaptain.user_id === pick.user_id : i === 0;
      await db.teamMember.upsert({
        where: { team_id_user_id: { team_id: teamId, user_id: pick.user_id } },
        create: { team_id: teamId, user_id: pick.user_id, is_captain: isCaptain },
        update: {},
      });
    }
  }

  await db.match.update({
    where: { id: matchId },
    data: { draft_locked: true, team_balance_score: balanceScore },
  });

  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/match/${matchId}/draft`);
  return { success: "Draft bloccato" };
};

export const movePlayer = async (matchId: number, userId: string, toTeamId: number) => {
  const role = await currentRole();
  if (!hasPermission(role, "executeDraft")) return { error: "Non autorizzato" };

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partita non trovata" };
  if (match.draft_locked) return { error: "Draft bloccato" };

  const pick = await db.draftPick.findFirst({ where: { match_id: matchId, user_id: userId } });
  if (!pick) return { error: "Giocatore non trovato nel draft" };

  const fromTeamId = pick.team_id;
  if (fromTeamId === toTeamId) return { success: "Nessuna modifica" };

  await db.draftPick.update({ where: { id: pick.id }, data: { team_id: toTeamId } });

  // Re-index pick_order for both affected teams
  for (const teamId of [fromTeamId, toTeamId]) {
    const teamPicks = await db.draftPick.findMany({
      where: { match_id: matchId, team_id: teamId },
      orderBy: { pick_order: "asc" },
    });
    for (let i = 0; i < teamPicks.length; i++) {
      await db.draftPick.update({ where: { id: teamPicks[i].id }, data: { pick_order: i + 1 } });
    }
  }

  revalidatePath(`/match/${matchId}/draft`);
  return { success: "Giocatore spostato" };
};

export const setCaptain = async (matchId: number, teamId: number, userId: string) => {
  const role = await currentRole();
  if (!hasPermission(role, "executeDraft")) return { error: "Non autorizzato" };

  await db.teamMember.updateMany({ where: { team_id: teamId }, data: { is_captain: false } });

  await db.teamMember.upsert({
    where: { team_id_user_id: { team_id: teamId, user_id: userId } },
    create: { team_id: teamId, user_id: userId, is_captain: true },
    update: { is_captain: true },
  });

  revalidatePath(`/match/${matchId}/draft`);
  return { success: "Capitano impostato" };
};

export const resetDraft = async (matchId: number) => {
  const role = await currentRole();
  if (!hasPermission(role, "executeDraft")) return { error: "Non autorizzato" };

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partita non trovata" };
  if (match.draft_locked) return { error: "Draft bloccato. Sblocca prima di azzerare." };

  await db.draftPick.deleteMany({ where: { match_id: matchId } });

  const games = await db.game.findMany({
    where: { match_id: matchId },
    select: { team1_id: true, team2_id: true },
  });

  const rawIds = games.flatMap((g) => [g.team1_id, g.team2_id]).filter(Boolean) as number[];
  const teamIds = Array.from(new Set(rawIds));

  await db.game.updateMany({ where: { match_id: matchId }, data: { team1_id: null, team2_id: null } });

  if (teamIds.length > 0) {
    await db.teamMember.deleteMany({ where: { team_id: { in: teamIds } } });
    await db.team.deleteMany({ where: { id: { in: teamIds } } });
  }

  await db.match.update({
    where: { id: matchId },
    data: { team_balance_score: null },
  });

  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/match/${matchId}/draft`);
  return { success: "Draft azzerato" };
};
