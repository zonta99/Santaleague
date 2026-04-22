import { describe, it, expect } from "bun:test";
import { getTier } from "../data/stats";

describe("getTier", () => {
  it("returns Bronze for level 0", () => {
    expect(getTier(0)).toBe("Bronze");
  });

  it("returns Bronze for level 2.9", () => {
    expect(getTier(2.9)).toBe("Bronze");
  });

  it("returns Silver at level 3", () => {
    expect(getTier(3)).toBe("Silver");
  });

  it("returns Silver at level 4.9", () => {
    expect(getTier(4.9)).toBe("Silver");
  });

  it("returns Gold at level 5", () => {
    expect(getTier(5)).toBe("Gold");
  });

  it("returns Gold at level 6.9", () => {
    expect(getTier(6.9)).toBe("Gold");
  });

  it("returns Platinum at level 7", () => {
    expect(getTier(7)).toBe("Platinum");
  });

  it("returns Platinum at level 8.9", () => {
    expect(getTier(8.9)).toBe("Platinum");
  });

  it("returns Legend at level 9", () => {
    expect(getTier(9)).toBe("Legend");
  });

  it("returns Legend at level 10", () => {
    expect(getTier(10)).toBe("Legend");
  });
});
