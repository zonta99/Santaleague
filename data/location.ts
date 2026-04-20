import { db } from "@/lib/db";

export const getAllLocations = async (leagueId?: string) =>
  db.location.findMany({
    where: leagueId ? { league_id: leagueId } : undefined,
    orderBy: { name: "asc" },
  });

export const getLocationById = async (id: number) =>
  db.location.findUnique({ where: { id } });
