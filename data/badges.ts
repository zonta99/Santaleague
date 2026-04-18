import { db } from "@/lib/db";

export const getPlayerBadges = async (userId: string) => {
  return db.userBadge.findMany({
    where: { user_id: userId },
    include: {
      Badge: true,
      Season: { select: { id: true, name: true } },
    },
    orderBy: { awarded_at: "desc" },
  });
};
