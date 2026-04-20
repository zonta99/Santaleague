import { LeagueRole, UserRole } from "@prisma/client";

export const Permissions = {
  manageUsers: [UserRole.ADMIN] as UserRole[],
} as const;

export type Permission = keyof typeof Permissions;

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean =>
  !!role && Permissions[permission].includes(role);

// League-scoped permissions
export type LeaguePermission = keyof typeof LeaguePermissions;

const OWNER_AND_MANAGER = [LeagueRole.OWNER, LeagueRole.MANAGER] as LeagueRole[];
const OWNER_ONLY = [LeagueRole.OWNER] as LeagueRole[];

export const LeaguePermissions = {
  createMatch:      OWNER_AND_MANAGER,
  updateMatchStatus:OWNER_AND_MANAGER,
  manageLocations:  OWNER_AND_MANAGER,
  manageGameEvents: OWNER_AND_MANAGER,
  executeDraft:     OWNER_AND_MANAGER,
  manageSeasons:    OWNER_AND_MANAGER,
  sendInvite:       OWNER_AND_MANAGER,
  manageMembers:    OWNER_ONLY,
  updateLeague:     OWNER_ONLY,
} as const;

export const hasLeaguePermission = (
  role: LeagueRole | undefined,
  permission: LeaguePermission
): boolean => !!role && (LeaguePermissions[permission] as LeagueRole[]).includes(role);
