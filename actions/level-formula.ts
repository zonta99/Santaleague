"use server";

import { db } from "@/lib/db";
import { currentRole, currentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { LevelFormulaSchema } from "@/schemas";
import { revalidatePath } from "next/cache";
import * as z from "zod";

export const getLevelFormula = async () => {
  const formula = await db.levelFormula.findFirst();
  return {
    field_weight: formula?.field_weight ?? 0.5,
    win_weight: formula?.win_weight ?? 0.3,
    goal_weight: formula?.goal_weight ?? 0.2,
    updated_at: formula?.updated_at ?? null,
  };
};

export const updateLevelFormula = async (values: z.infer<typeof LevelFormulaSchema>) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  const parsed = LevelFormulaSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Valori non validi" };

  const user = await currentUser();
  const existing = await db.levelFormula.findFirst();

  if (existing) {
    await db.levelFormula.update({
      where: { id: existing.id },
      data: { ...parsed.data, updated_by: user?.id ?? null },
    });
  }

  revalidatePath("/leaderboard");
  revalidatePath("/player");
  revalidatePath("/admin");
  return { success: "Formula aggiornata" };
};

export const updateLeagueLevelFormula = async (leagueId: string, values: z.infer<typeof LevelFormulaSchema>) => {
  const { canPerformLeagueAction } = await import("@/lib/league-auth");
  const allowed = await canPerformLeagueAction(leagueId, "manageSeasons");
  if (!allowed) return { error: "Non autorizzato" };

  const parsed = LevelFormulaSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Valori non validi" };

  const user = await currentUser();
  const existing = await db.levelFormula.findUnique({ where: { league_id: leagueId } });

  if (existing) {
    await db.levelFormula.update({
      where: { league_id: leagueId },
      data: { ...parsed.data, updated_by: user?.id ?? null },
    });
  }

  revalidatePath("/leaderboard");
  revalidatePath("/player");
  revalidatePath("/admin");
  return { success: "Formula aggiornata" };
};
