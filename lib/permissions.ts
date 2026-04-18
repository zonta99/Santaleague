import { UserRole } from "@prisma/client";

const MODERATOR_AND_ABOVE = [UserRole.ADMIN, UserRole.MODERATOR] as UserRole[];
const ADMIN_ONLY = [UserRole.ADMIN] as UserRole[];

export const Permissions = {
  manageUsers: ADMIN_ONLY,
  createMatch: MODERATOR_AND_ABOVE,
  updateMatchStatus: MODERATOR_AND_ABOVE,
  manageLocations: MODERATOR_AND_ABOVE,
  manageGameEvents: MODERATOR_AND_ABOVE,
  executeDraft: MODERATOR_AND_ABOVE,
  manageSeasons: MODERATOR_AND_ABOVE,
} as const;

export type Permission = keyof typeof Permissions;

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean =>
  !!role && Permissions[permission].includes(role);
