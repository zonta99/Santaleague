import { UserRole } from "@prisma/client";
import { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  nickname?: string | null;
  nicknameChangedAt?: string | null;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}
