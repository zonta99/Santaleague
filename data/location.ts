import { db } from "@/lib/db";

export const getAllLocations = async () =>
  db.location.findMany({ orderBy: { name: "asc" } });

export const getLocationById = async (id: number) =>
  db.location.findUnique({ where: { id } });
