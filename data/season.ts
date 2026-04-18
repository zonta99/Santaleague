import { db } from "@/lib/db";

export const getAllSeasons = async () => {
  return db.season.findMany({
    orderBy: { start_date: "desc" },
    select: {
      id: true,
      name: true,
      start_date: true,
      end_date: true,
      status: true,
      champion_id: true,
      Champion: { select: { name: true } },
    },
  });
};

export const getActiveSeason = async () => {
  return db.season.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
  });
};

export const getPlayerChampionships = async (userId: string) => {
  return db.season.findMany({
    where: { champion_id: userId, status: "COMPLETED" },
    select: { id: true, name: true },
    orderBy: { end_date: "desc" },
  });
};

export const getSeasonById = async (id: number) => {
  return db.season.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      start_date: true,
      end_date: true,
      status: true,
      champion_id: true,
      Champion: { select: { id: true, name: true, image: true } },
    },
  });
};
