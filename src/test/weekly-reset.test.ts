import { describe, it, expect } from "vitest";
import { applyWeeklyReset, weekKey } from "@/lib/schedule-data";

describe("weekly reset", () => {
  it("keeps check-offs within the same week (Mon to Sun)", () => {
    const s = { weekKey: weekKey(new Date(2026, 9, 19)), done: { a: true } };
    expect(applyWeeklyReset(s, new Date(2026, 9, 25)).done).toEqual({ a: true });
  });
  it("clears check-offs when a new week starts on Monday", () => {
    const s = { weekKey: weekKey(new Date(2026, 9, 25)), done: { a: true } };
    expect(applyWeeklyReset(s, new Date(2026, 9, 26)).done).toEqual({});
  });
});
