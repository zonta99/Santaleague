"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { LeagueRole } from "@prisma/client";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canPerformLeagueAction } from "@/lib/league-auth";
import { getLeagueMember, getUserLeagues, getLeagueByPublicToken } from "@/data/league";
import { CreateLeagueSchema, UpdateLeagueSchema } from "@/schemas";

export const setActiveLeagueAction = async (leagueId: string) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const member = await getLeagueMember(leagueId, user.id);
  if (!member) return { error: "Non sei membro di questa lega" };

  const jar = await cookies();
  jar.set("active-league", JSON.stringify({ leagueId }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { success: true };
};

export const clearActiveLeagueAction = async () => {
  const jar = await cookies();
  jar.delete("active-league");
  return { success: true };
};

export const createLeague = async (values: { name: string; slug: string; description?: string }) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const parsed = CreateLeagueSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const existing = await db.league.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { error: "Slug già in uso, scegline un altro" };

  const league = await db.league.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      LeagueMember: {
        create: { user_id: user.id, role: LeagueRole.OWNER },
      },
      LevelFormula: {
        create: { field_weight: 0.5, win_weight: 0.3, goal_weight: 0.2 },
      },
    },
  });

  revalidatePath("/leagues");
  return { success: "Lega creata!", leagueId: league.id };
};

export const updateLeague = async (leagueId: string, values: { name?: string; description?: string; logo?: string }) => {
  const parsed = UpdateLeagueSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const allowed = await canPerformLeagueAction(leagueId, "updateLeague");
  if (!allowed) return { error: "Non autorizzato" };

  await db.league.update({ where: { id: leagueId }, data: parsed.data });
  revalidatePath("/leagues");
  return { success: "Lega aggiornata" };
};

export const removeMember = async (leagueId: string, userId: string) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const allowed = await canPerformLeagueAction(leagueId, "manageMembers");
  if (!allowed) return { error: "Non autorizzato" };

  const target = await getLeagueMember(leagueId, userId);
  if (!target) return { error: "Membro non trovato" };
  if (target.role === LeagueRole.OWNER) return { error: "Non puoi rimuovere il proprietario" };

  await db.leagueMember.delete({
    where: { league_id_user_id: { league_id: leagueId, user_id: userId } },
  });
  revalidatePath("/leagues");
  return { success: "Membro rimosso" };
};

export const promoteMember = async (leagueId: string, userId: string, role: LeagueRole) => {
  const allowed = await canPerformLeagueAction(leagueId, "manageMembers");
  if (!allowed) return { error: "Non autorizzato" };

  const target = await db.leagueMember.findUnique({
    where: { league_id_user_id: { league_id: leagueId, user_id: userId } },
    select: { role: true },
  });
  if (target?.role === LeagueRole.OWNER) return { error: "Non puoi modificare il ruolo di un proprietario" };

  await db.leagueMember.update({
    where: { league_id_user_id: { league_id: leagueId, user_id: userId } },
    data: { role },
  });
  revalidatePath("/leagues");
  return { success: "Ruolo aggiornato" };
};

export const leaveLeague = async (leagueId: string) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const member = await getLeagueMember(leagueId, user.id);
  if (!member) return { error: "Non sei membro di questa lega" };

  if (member.role === LeagueRole.OWNER) {
    const memberCount = await db.leagueMember.count({ where: { league_id: leagueId } });
    if (memberCount - 1 > 0) return { error: "Trasferisci la proprietà prima di uscire dalla lega" };
  }

  await db.leagueMember.delete({
    where: { league_id_user_id: { league_id: leagueId, user_id: user.id } },
  });
  revalidatePath("/");
  return { success: "Hai lasciato la lega" };
};

export const getUserLeaguesAction = async () => {
  const user = await currentUser();
  if (!user?.id) return [];
  return getUserLeagues(user.id);
};

export const generatePublicLink = async (leagueId: string) => {
  const allowed = await canPerformLeagueAction(leagueId, "updateLeague");
  if (!allowed) return { error: "Non autorizzato" };

  const token = uuidv4();
  await db.league.update({ where: { id: leagueId }, data: { public_invite_token: token } });
  revalidatePath("/admin");
  return { success: "Link generato", token };
};

export const disablePublicLink = async (leagueId: string) => {
  const allowed = await canPerformLeagueAction(leagueId, "updateLeague");
  if (!allowed) return { error: "Non autorizzato" };

  await db.league.update({ where: { id: leagueId }, data: { public_invite_token: null } });
  revalidatePath("/admin");
  return { success: "Link disabilitato" };
};

export const requestJoinLeague = async (token: string) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Devi essere autenticato per richiedere l'accesso" };

  const league = await getLeagueByPublicToken(token);
  if (!league) return { error: "Link non valido" };

  const alreadyMember = await getLeagueMember(league.id, user.id);
  if (alreadyMember) return { success: "Sei già membro di questa lega", leagueId: league.id };

  const existing = await db.leagueJoinRequest.findUnique({
    where: { league_id_user_id: { league_id: league.id, user_id: user.id } },
  });
  if (existing) {
    if (existing.status === "PENDING") return { success: "Richiesta già inviata, attendi l'approvazione" };
    if (existing.status === "APPROVED") return { success: "Sei già membro di questa lega", leagueId: league.id };
  }

  await db.leagueJoinRequest.upsert({
    where: { league_id_user_id: { league_id: league.id, user_id: user.id } },
    create: { league_id: league.id, user_id: user.id, status: "PENDING" },
    update: { status: "PENDING" },
  });

  // Notify league owners and managers
  const { createNotificationsForUsers } = await import("@/actions/notifications");
  const managers = await db.leagueMember.findMany({
    where: { league_id: league.id, role: { in: ["OWNER", "MANAGER"] } },
    select: { user_id: true },
  });
  await createNotificationsForUsers(
    managers.map((m) => m.user_id),
    "JOIN_REQUEST",
    "Nuova richiesta di accesso",
    `${user.name ?? user.email} ha richiesto di unirsi a ${league.name}`,
    { leagueId: league.id, userId: user.id }
  );

  return { success: "Richiesta inviata! Attendi l'approvazione dell'admin." };
};

export const approveJoinRequest = async (requestId: string) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const request = await db.leagueJoinRequest.findUnique({
    where: { id: requestId },
    include: { User: true, League: true },
  });
  if (!request) return { error: "Richiesta non trovata" };

  const allowed = await canPerformLeagueAction(request.league_id, "manageMembers");
  if (!allowed) return { error: "Non autorizzato" };

  await db.$transaction([
    db.leagueMember.create({
      data: { league_id: request.league_id, user_id: request.user_id, role: LeagueRole.MEMBER },
    }),
    db.leagueJoinRequest.update({ where: { id: requestId }, data: { status: "APPROVED" } }),
  ]);

  const { createNotificationsForUsers } = await import("@/actions/notifications");
  await createNotificationsForUsers(
    [request.user_id],
    "JOIN_REQUEST",
    "Richiesta approvata!",
    `La tua richiesta di unirti a ${request.League.name} è stata approvata.`,
    { leagueId: request.league_id }
  );

  revalidatePath("/admin");
  return { success: "Richiesta approvata" };
};

export const rejectJoinRequest = async (requestId: string) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const request = await db.leagueJoinRequest.findUnique({
    where: { id: requestId },
    include: { User: true, League: true },
  });
  if (!request) return { error: "Richiesta non trovata" };

  const allowed = await canPerformLeagueAction(request.league_id, "manageMembers");
  if (!allowed) return { error: "Non autorizzato" };

  await db.leagueJoinRequest.update({ where: { id: requestId }, data: { status: "REJECTED" } });

  const { createNotificationsForUsers } = await import("@/actions/notifications");
  await createNotificationsForUsers(
    [request.user_id],
    "JOIN_REQUEST",
    "Richiesta rifiutata",
    `La tua richiesta di unirti a ${request.League.name} è stata rifiutata.`,
    { leagueId: request.league_id }
  );

  revalidatePath("/admin");
  return { success: "Richiesta rifiutata" };
};
