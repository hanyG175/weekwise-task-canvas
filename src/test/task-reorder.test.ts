import { describe, expect, it } from "vitest";
import { reorderTasks, type Task } from "@/lib/schedule-data";

const tasks: Task[] = [
  { id: "a", start: "08:00", end: "08:50", title: "Focus", cat: "P" },
  { id: "b", start: "08:50", end: "09:00", title: "Break", cat: "rest" },
  { id: "c", start: "09:05", end: "09:55", title: "Study", cat: "L" },
];
describe("task reordering", () => {
  it("moves tasks forward and preserves durations, gaps and identities", () => {
    expect(reorderTasks(tasks, "a", "c").map(({ id, start, end }) => ({ id, start, end }))).toEqual([
      { id: "b", start: "08:00", end: "08:10" },
      { id: "c", start: "08:10", end: "09:00" },
      { id: "a", start: "09:05", end: "09:55" },
    ]);
  });
  it("moves tasks backward without changing the end of the day", () => {
    const result = reorderTasks(tasks, "c", "a");
    expect(result.map((t) => t.id)).toEqual(["c", "a", "b"]);
    expect(result[2]?.end).toBe("09:55");
    expect(tasks[0]?.id).toBe("a");
  });
  it("ignores canceled or unchanged drops", () => {
    expect(reorderTasks(tasks, "missing", "a")).toBe(tasks);
    expect(reorderTasks(tasks, "a", "a")).toBe(tasks);
  });
});