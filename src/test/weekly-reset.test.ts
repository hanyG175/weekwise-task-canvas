import { describe, it, expect } from "vitest";
import { applyWeeklyReset, weekKey, DAYS, todayDay } from "@/lib/schedule-data";

describe("weekly reset", () => {
  it("keeps check-offs within the same week (Sunday to Saturday)", () => {
    const s = { weekKey: weekKey(new Date(2026, 9, 18)), done: { a: true } };
    expect(applyWeeklyReset(s, new Date(2026, 9, 24)).done).toEqual({ a: true });
  });
  it("clears check-offs when a new week starts on Sunday", () => {
    const s = { weekKey: weekKey(new Date(2026, 9, 24)), done: { a: true } };
    expect(applyWeeklyReset(s, new Date(2026, 9, 25)).done).toEqual({});
  });
  it("orders days Sunday first while identifying today correctly", () => {
    expect(DAYS).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    expect(todayDay(new Date(2026, 9, 25))).toBe("Sun");
    expect(todayDay(new Date(2026, 9, 26))).toBe("Mon");
  });
});
