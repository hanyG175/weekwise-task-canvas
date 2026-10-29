import { describe, expect, it } from "vitest";
import { changeTimerTime, currentScheduledTask, makeTimer, nextTimerTask, remainingSeconds, skipToTask } from "@/lib/task-timer";
import { type Task } from "@/lib/schedule-data";

const tasks: Task[] = [
  { id: "focus", start: "08:00", end: "08:50", title: "Focus", cat: "P" },
  { id: "break", start: "08:50", end: "09:00", title: "Break", cat: "rest" },
  { id: "study", start: "09:00", end: "09:50", title: "Study", cat: "L" },
];
const focus = tasks[0] as Task;
describe("task countdown", () => {
  it("detects the scheduled task using local time and exclusive end boundaries", () => {
    expect(currentScheduledTask(tasks, new Date(2026, 9, 29, 8, 49))?.id).toBe("focus");
    expect(currentScheduledTask(tasks, new Date(2026, 9, 29, 8, 50))?.id).toBe("break");
  });
  it("returns no current task before, after or between scheduled tasks", () => {
    expect(currentScheduledTask(tasks, new Date(2026, 9, 29, 7, 59))).toBeUndefined();
    expect(currentScheduledTask(tasks, new Date(2026, 9, 29, 9, 50))).toBeUndefined();
    expect(currentScheduledTask([focus, tasks[2] as Task], new Date(2026, 9, 29, 8, 55))).toBeUndefined();
  });
  it("skips earlier tasks, reopens the current task, and preserves later and other-day progress", () => {
    expect(skipToTask(tasks, { break: true, study: true, "Fri-0": true }, "break")).toEqual({ focus: true, break: false, study: true, "Fri-0": true });
  });
  it("starts the current task immediately with its full duration", () => {
    const current = currentScheduledTask(tasks, new Date(2026, 9, 29, 8, 55));
    if (!current) throw new Error("Expected current task");
    expect(makeTimer(current, true, 1000)).toEqual({ taskId: "break", seconds: 600, deadline: 601000, status: "running" });
  });
  it("starts with the task duration", () => {
    expect(makeTimer(focus, true, 1000)).toEqual({ taskId: "focus", seconds: 3000, deadline: 3001000, status: "running" });
  });
  it("uses elapsed wall time and stops at zero", () => {
    const timer = makeTimer(focus, true, 1000);
    expect(remainingSeconds(timer, 61000)).toBe(2940);
    expect(remainingSeconds(timer, 4000000)).toBe(0);
  });
  it("resets the next task to its own duration after completion", () => {
    const next = nextTimerTask(tasks, {}, "focus");
    expect(next?.id).toBe("break");
    if (!next) throw new Error("Expected next task");
    expect(makeTimer(next, true, 5000).seconds).toBe(600);
  });
  it("skips checked tasks and stops after the final task", () => {
    expect(nextTimerTask(tasks, { break: true }, "focus")?.id).toBe("study");
    expect(nextTimerTask(tasks, {}, "study")).toBeUndefined();
  });
  it("lets remaining time change while running", () => {
    const changed = changeTimerTime(makeTimer(focus, true, 1000), 90, 10000);
    expect(changed.deadline).toBe(100000);
    expect(remainingSeconds(changed, 40000)).toBe(60);
  });
  it("keeps adjusted paused time stopped", () => {
    const changed = changeTimerTime(makeTimer(focus), 120, 10000);
    expect(changed.status).toBe("paused");
    expect(remainingSeconds(changed, 900000)).toBe(120);
  });
});