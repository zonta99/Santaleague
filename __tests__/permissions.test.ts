import { describe, it, expect } from "bun:test";
import { hasPermission, hasLeaguePermission } from "../lib/permissions";
import { UserRole, LeagueRole } from "@prisma/client";

describe("hasPermission", () => {
  it("grants manageUsers to ADMIN", () => {
    expect(hasPermission(UserRole.ADMIN, "manageUsers")).toBe(true);
  });

  it("denies manageUsers to USER", () => {
    expect(hasPermission(UserRole.USER, "manageUsers")).toBe(false);
  });

  it("denies manageUsers to MODERATOR", () => {
    expect(hasPermission(UserRole.MODERATOR, "manageUsers")).toBe(false);
  });

  it("denies when role is undefined", () => {
    expect(hasPermission(undefined, "manageUsers")).toBe(false);
  });
});

describe("hasLeaguePermission", () => {
  describe("OWNER_AND_MANAGER permissions", () => {
    const ownerManagerPerms = [
      "createMatch",
      "updateMatchStatus",
      "manageLocations",
      "manageGameEvents",
      "executeDraft",
      "manageSeasons",
      "sendInvite",
    ] as const;

    for (const perm of ownerManagerPerms) {
      it(`OWNER can ${perm}`, () => {
        expect(hasLeaguePermission(LeagueRole.OWNER, perm)).toBe(true);
      });

      it(`MANAGER can ${perm}`, () => {
        expect(hasLeaguePermission(LeagueRole.MANAGER, perm)).toBe(true);
      });

      it(`MEMBER cannot ${perm}`, () => {
        expect(hasLeaguePermission(LeagueRole.MEMBER, perm)).toBe(false);
      });
    }
  });

  describe("OWNER_ONLY permissions", () => {
    const ownerOnlyPerms = ["manageMembers", "updateLeague"] as const;

    for (const perm of ownerOnlyPerms) {
      it(`OWNER can ${perm}`, () => {
        expect(hasLeaguePermission(LeagueRole.OWNER, perm)).toBe(true);
      });

      it(`MANAGER cannot ${perm}`, () => {
        expect(hasLeaguePermission(LeagueRole.MANAGER, perm)).toBe(false);
      });

      it(`MEMBER cannot ${perm}`, () => {
        expect(hasLeaguePermission(LeagueRole.MEMBER, perm)).toBe(false);
      });
    }
  });

  it("denies when role is undefined", () => {
    expect(hasLeaguePermission(undefined, "createMatch")).toBe(false);
  });
});
