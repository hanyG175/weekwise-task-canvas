import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, Check, Pause, Play, RotateCcw, Square, Timer, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAY_NAMES, toMin, type Day, type Task } from "@/lib/schedule-data";
import { changeTimerTime, makeTimer, nextTimerTask, remainingSeconds, type TimerState } from "@/lib/task-timer";

export function useTaskTimer(tasks: Record<Day, Task[]> | undefined, done: Record<string, boolean> | undefined, day: Day, resetKey: string) {
  const [timer, setTimer] = useState<(TimerState & { day: Day }) | null>(null);
  const [sound, setSound] = useState(true);
  const [notification, setNotification] = useState("off");
  const audio = useRef<AudioContext | null>(null);
  const alertRef = useRef<() => void>(() => {});
  const exhaustedDay = useRef<Day | null>(null);
  const task = timer ? tasks?.[timer.day].find((t) => t.id === timer.taskId) : undefined;

  useEffect(() => { exhaustedDay.current = null; setTimer(null); }, [resetKey]);
  useEffect(() => {
    if (!tasks || !done) return;
    if (exhaustedDay.current === day && !timer) return;
    if (exhaustedDay.current !== day) exhaustedDay.current = null;
    if (timer && (timer.day === day || timer.status !== "ready") && tasks[timer.day].some((t) => t.id === timer.taskId) && !done[timer.taskId]) return;
    const first = [...tasks[day]].sort((a, b) => toMin(a.start) - toMin(b.start)).find((t) => !done[t.id]);
    setTimer(first ? { ...makeTimer(first), day } : null);
  }, [tasks, done, day, timer]);
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "denied") setNotification("blocked");
    return () => { void audio.current?.close(); };
  }, []);
  const unlockSound = () => {
    try {
      if (!audio.current) audio.current = new AudioContext();
      void audio.current.resume().catch(() => {});
    } catch { /* Sound may be unavailable on this browser. */ }
  };
  alertRef.current = () => {
    if (sound && audio.current) {
      const ctx = audio.current;
      void ctx.resume().then(() => {
        for (let i = 0; i < 3; i++) {
          const osc = ctx.createOscillator(), gain = ctx.createGain();
          const start = ctx.currentTime + i * 0.4;
          osc.frequency.value = i === 1 ? 880 : 660;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(start); osc.stop(start + 0.32);
        }
      }).catch(() => {});
    }
    if (notification === "on" && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification("Task time is up", { body: task?.title ?? "Your task timer has finished.", tag: "schedule-task-timer" }); } catch { setNotification("unavailable"); }
    }
  };
  useEffect(() => {
    if (!timer || timer.status !== "running") return;
    const tick = () => {
      const seconds = remainingSeconds(timer, Date.now());
      if (seconds === 0) {
        setTimer({ ...timer, seconds: 0, deadline: null, status: "finished" });
        alertRef.current();
        clearInterval(interval);
      } else setTimer((p) => p?.deadline === timer.deadline ? { ...p, seconds } : p);
    };
    const interval = setInterval(tick, 250);
    const wake = () => tick();
    document.addEventListener("visibilitychange", wake);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", wake); };
  }, [timer?.deadline, timer?.status]);

  const select = (id: string) => {
    const selected = tasks?.[day].find((t) => t.id === id);
    if (selected) { exhaustedDay.current = null; setTimer({ ...makeTimer(selected), day }); }
  };
  const complete = (id: string) => {
    if (!timer || timer.taskId !== id || !tasks || !done || done[id]) return;
    const next = nextTimerTask(tasks[timer.day], done, id);
    const running = timer.status === "running" || timer.status === "finished";
    if (running) unlockSound();
    if (!next) exhaustedDay.current = timer.day;
    setTimer(next ? { ...makeTimer(next, running, Date.now()), day: timer.day } : null);
  };
  const start = () => {
    if (!timer || !task) return;
    unlockSound();
    const seconds = timer.seconds > 0 ? timer.seconds : makeTimer(task).seconds;
    setTimer({ ...timer, seconds, status: "running", deadline: Date.now() + seconds * 1000 });
  };
  const startTask = (selected: Task, selectedDay: Day) => {
    unlockSound();
    exhaustedDay.current = null;
    setTimer({ ...makeTimer(selected, true, Date.now()), day: selectedDay });
  };
  const pause = () => setTimer((p) => p ? { ...p, seconds: remainingSeconds(p, Date.now()), deadline: null, status: "paused" } : p);
  const reset = () => { if (task && timer) setTimer({ ...makeTimer(task), day: timer.day }); };
  const adjust = (seconds: number) => setTimer((p) => p ? { ...changeTimerTime(p, seconds, Date.now()), day: p.day } : p);
  const enableNotifications = async () => {
    if (notification === "on") { setNotification("off"); return; }
    if (typeof Notification === "undefined") { setNotification("unavailable"); return; }
    try { const permission = await Notification.requestPermission(); setNotification(permission === "granted" ? "on" : permission === "denied" ? "blocked" : "off"); }
    catch { setNotification("unavailable"); }
  };
  return { timer, task, sound, notification, select, complete, start, startTask, pause, reset, adjust, enableNotifications,
    toggleSound: () => { unlockSound(); setSound((p) => !p); } };
}

export function TaskTimer({ controller: c, tasks, done, day, onComplete }: {
  controller: ReturnType<typeof useTaskTimer>; tasks: Task[]; done: Record<string, boolean>; day: Day; onComplete: (id: string) => void;
}) {
  const [editingTime, setEditingTime] = useState(false);
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("0");
  const t = c.timer;
  const remaining = t?.seconds ?? 0;
  const display = `${String(Math.floor(remaining / 3600)).padStart(2, "0")}:${String(Math.floor(remaining / 60) % 60).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  const options = [...tasks].sort((a, b) => toMin(a.start) - toMin(b.start)).filter((task) => !done[task.id]);
  if (c.task && !options.some((task) => task.id === c.task?.id)) options.unshift(c.task);
  const customSeconds = Number(minutes) * 60 + Number(seconds);
  return (
    <section aria-label="Task timer" className="mt-6 border-y border-border py-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="min-w-0 w-full sm:max-w-sm">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><Timer className="size-4 text-primary" />Task timer <span className="ml-auto font-mono text-xs">{t ? DAY_NAMES[t.day] : DAY_NAMES[day]}</span></div>
          <Select value={t?.taskId ?? ""} onValueChange={c.select} disabled={!options.length}>
            <SelectTrigger aria-label="Timer task" className="w-full [&>span]:truncate"><SelectValue placeholder="All tasks complete" /></SelectTrigger>
            <SelectContent>{options.map((task) => <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>)}</SelectContent>
          </Select>
          <p role="status" className="mt-2 text-sm text-muted-foreground">{t?.status === "finished" ? "Time’s up" : t?.status === "running" ? "In progress" : t?.status === "paused" ? "Paused" : t ? "Ready" : "Day complete"}</p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <Button variant="ghost" className="h-auto p-0 font-mono text-3xl tabular-nums text-primary hover:bg-transparent sm:text-4xl" aria-label="Change timer time" disabled={!t}
            onClick={() => { setMinutes(String(Math.floor(remaining / 60))); setSeconds(String(remaining % 60)); setEditingTime((p) => !p); }}>{display}</Button>
          <div className="flex items-center gap-1">
            <Button size="icon" aria-label={t?.status === "running" ? "Pause timer" : "Start timer"} title={t?.status === "running" ? "Pause" : "Start"} disabled={!t} onClick={t?.status === "running" ? c.pause : c.start}>{t?.status === "running" ? <Pause /> : <Play />}</Button>
            <Button size="icon" variant="ghost" aria-label="Stop timer" title="Stop and reset" disabled={!t} onClick={c.reset}><Square /></Button>
            <Button size="icon" variant="ghost" aria-label="Reset timer" title="Reset to task duration" disabled={!t} onClick={c.reset}><RotateCcw /></Button>
            <Button size="icon" variant="outline" aria-label="Complete timed task" title="Complete task and move to next" disabled={!t} onClick={() => t && onComplete(t.taskId)}><Check /></Button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label={c.sound ? "Mute timer sound" : "Enable timer sound"} title={c.sound ? "Sound on" : "Sound off"} aria-pressed={c.sound} onClick={c.toggleSound}>{c.sound ? <Volume2 /> : <VolumeX />}</Button>
          <Button size="icon" variant={c.notification === "on" ? "secondary" : "ghost"} aria-label={c.notification === "on" ? "Disable timer notifications" : "Enable timer notifications"} title={`Notifications ${c.notification}`} aria-pressed={c.notification === "on"} onClick={c.enableNotifications}>{c.notification === "on" ? <Bell /> : <BellOff />}</Button>
          {(c.notification === "blocked" || c.notification === "unavailable") && <span className="max-w-40 text-xs text-muted-foreground">{c.notification === "blocked" ? "Notifications blocked in browser settings" : "Notifications unavailable in this browser"}</span>}
        </div>
      </div>
      {editingTime && t && <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (Number.isFinite(customSeconds) && customSeconds > 0) { c.adjust(customSeconds); setEditingTime(false); } }}>
        <div className="grid gap-1"><Label htmlFor="timer-minutes">Minutes</Label><Input id="timer-minutes" className="w-24" type="number" min="0" step="1" required value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div>
        <div className="grid gap-1"><Label htmlFor="timer-seconds">Seconds</Label><Input id="timer-seconds" className="w-24" type="number" min="0" max="59" step="1" required value={seconds} onChange={(e) => setSeconds(e.target.value)} /></div>
        <Button type="submit" variant="secondary" disabled={!Number.isFinite(customSeconds) || customSeconds <= 0}>Set time</Button>
        <Button type="button" variant="ghost" onClick={() => setEditingTime(false)}>Cancel</Button>
      </form>}
    </section>
  );
}