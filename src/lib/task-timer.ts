import { toMin, type Task } from "@/lib/schedule-data";

export type TimerStatus = "ready" | "running" | "paused" | "finished";
export interface TimerState {
  taskId: string;
  seconds: number;
  deadline: number | null;
  status: TimerStatus;
}
export const taskSeconds = (task: Task) => Math.max(1, (toMin(task.end) - toMin(task.start)) * 60);
export function makeTimer(task: Task, running = false, now = 0): TimerState {
  const seconds = taskSeconds(task);
  return { taskId: task.id, seconds, deadline: running ? now + seconds * 1000 : null, status: running ? "running" : "ready" };
}
export function remainingSeconds(timer: TimerState, now: number) {
  return timer.deadline === null ? timer.seconds : Math.max(0, Math.ceil((timer.deadline - now) / 1000));
}
export function changeTimerTime(timer: TimerState, seconds: number, now: number): TimerState {
  const safe = Math.max(1, Math.round(seconds));
  return { ...timer, seconds: safe, deadline: timer.status === "running" ? now + safe * 1000 : null, status: timer.status === "running" ? "running" : "paused" };
}
export function nextTimerTask(tasks: Task[], done: Record<string, boolean>, completedId: string) {
  const ordered = [...tasks].sort((a, b) => toMin(a.start) - toMin(b.start));
  const index = ordered.findIndex((t) => t.id === completedId);
  return ordered.slice(index + 1).find((t) => !done[t.id]);
}

/** Uses the device's local clock; end times are exclusive, including gaps. */
export function currentScheduledTask(tasks: Task[], now: Date): Task | undefined {
  const minute = now.getHours() * 60 + now.getMinutes();
  return [...tasks].sort((a, b) => toMin(a.start) - toMin(b.start))
    .find((task) => toMin(task.start) <= minute && minute < toMin(task.end));
}

/** Skip earlier tasks without touching other days, and reopen the task being started. */
export function skipToTask(tasks: Task[], done: Record<string, boolean>, taskId: string): Record<string, boolean> {
  const ordered = [...tasks].sort((a, b) => toMin(a.start) - toMin(b.start));
  const index = ordered.findIndex((task) => task.id === taskId);
  if (index < 0) return done;
  return { ...done, ...Object.fromEntries(ordered.slice(0, index).map((task) => [task.id, true])), [taskId]: false };
}