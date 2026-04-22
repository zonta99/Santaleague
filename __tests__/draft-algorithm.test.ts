import { describe, it, expect } from "bun:test";
import { snakeDraft, teamStrength, balanceDelta, PlayerWithLevel } from "../lib/draft-algorithm";

const p = (userId: string, level: number): PlayerWithLevel => ({ userId, level });

describe("teamStrength", () => {
  it("returns 0 for empty team", () => {
    expect(teamStrength([])).toBe(0);
  });

  it("sums all player levels", () => {
    expect(teamStrength([p("a", 3), p("b", 5), p("c", 2)])).toBe(10);
  });
});

describe("balanceDelta", () => {
  it("returns 0 for equally strong teams", () => {
    const buckets = [[p("a", 5)], [p("b", 5)]];
    expect(balanceDelta(buckets)).toBe(0);
  });

  it("returns difference between strongest and weakest team", () => {
    const buckets = [[p("a", 8)], [p("b", 3)]];
    expect(balanceDelta(buckets)).toBe(5);
  });
});

describe("snakeDraft", () => {
  it("distributes all players", () => {
    const players = [p("1", 9), p("2", 8), p("3", 7), p("4", 6)];
    const result = snakeDraft(players, 2);
    const total = result.reduce((s, t) => s + t.length, 0);
    expect(total).toBe(players.length);
  });

  it("creates the correct number of teams", () => {
    const players = [p("1", 9), p("2", 8), p("3", 7), p("4", 6), p("5", 5), p("6", 4)];
    const result = snakeDraft(players, 3);
    expect(result.length).toBe(3);
  });

  it("assigns the best player to team 0", () => {
    const players = [p("weak", 1), p("strong", 10), p("mid", 5)];
    const result = snakeDraft(players, 2);
    expect(result[0][0].userId).toBe("strong");
  });

  it("keeps team strength delta low for even distribution", () => {
    // snake: [10,8,6] vs [9,7,5] → 24 vs 21 → delta 3
    const players = [p("1", 10), p("2", 9), p("3", 8), p("4", 7), p("5", 6), p("6", 5)];
    const snakeResult = snakeDraft(players, 2);
    const snakeDelta = balanceDelta(snakeResult);
    expect(snakeDelta).toBeLessThanOrEqual(3);
  });

  it("handles empty player list", () => {
    const result = snakeDraft([], 2);
    expect(result.every((t) => t.length === 0)).toBe(true);
  });
});
