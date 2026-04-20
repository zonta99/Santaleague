import { UserRole } from "@prisma/client";

import { currentRole, currentUser } from "@/lib/auth";
import { getLeagueMember } from "@/data/league";
import { hasLeaguePermission, LeaguePermission } from "@/lib/permissions";

export const canPerformLeagueAction = async (
  leagueId: string,
  permission: LeaguePermission
): Promise<boolean> => {
  const globalRole = await currentRole();
  if (globalRole === UserRole.ADMIN) return true;

  const user = await currentUser();
  if (!user?.id) return false;

  const member = await getLeagueMember(leagueId, user.id);
  return hasLeaguePermission(member?.role, permission);
};
