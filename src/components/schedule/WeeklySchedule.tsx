import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Cloud, CloudOff, Loader2, Pencil, Plus, RotateCcw, Trash2, Undo2, ChevronLeft, ChevronRight, GripVertical, Moon, BookOpen, Hammer, Send, Map, Code2, BriefcaseBusiness, Clapperboard, ClipboardCheck, Dumbbell, Utensils, Coffee, Sparkles, Sunrise, Heart, Info, type LucideIcon } from "lucide-react";
import { pullSchedule, pushSchedule } from "@/lib/sheets-sync.functions";
import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, sortableKeyboardCoordinates, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import plannerIllustration from "@/assets/planner-illustration.png";
import { TaskTimer, useTaskTimer } from "@/components/schedule/TaskTimer";
import { currentScheduledTask, skipToTask } from "@/lib/task-timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  CATEGORIES, DAYS, DAY_NAMES, applyDefaultNotes, applyWeeklyReset, defaultSchedule, toMin, todayDay, weekKey, reorderTasks,
  type Category, type Day, type Task,
} from "@/lib/schedule-data";

const BG: Record<Category, string> = {
  prayer: "bg-cat-prayer", quran: "bg-cat-quran", P: "bg-cat-p", O: "bg-cat-o", R: "bg-cat-r",
  L: "bg-cat-l", A: "bg-cat-a", C: "bg-cat-c", W: "bg-cat-w", workout: "bg-cat-workout",
  meal: "bg-cat-meal", rest: "bg-cat-rest", free: "bg-cat-free", routine: "bg-cat-routine",
  social: "bg-cat-social",
};
const TEXT: Record<Category, string> = {
  prayer: "text-cat-prayer", quran: "text-cat-quran", P: "text-cat-p", O: "text-cat-o", R: "text-cat-r",
  L: "text-cat-l", A: "text-cat-a", C: "text-cat-c", W: "text-cat-w", workout: "text-cat-workout",
  meal: "text-cat-meal", rest: "text-cat-rest", free: "text-cat-free", routine: "text-cat-routine",
  social: "text-cat-social",
};

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  prayer: Moon, quran: BookOpen, P: Hammer, O: Send, R: Map, L: Code2,
  A: BriefcaseBusiness, C: Clapperboard, W: ClipboardCheck, workout: Dumbbell,
  meal: Utensils, rest: Coffee, free: Sparkles, routine: Sunrise, social: Heart,
};
function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon aria-hidden="true" className={cn("size-4 shrink-0", TEXT[category], className)} />;
}

const START = 6 * 60;
const END = 22 * 60 + 30;
const STORAGE = "weekly-schedule-v1";

interface State { tasks: Record<Day, Task[]>; done: Record<string, boolean>; weekKey: string; updatedAt: number }

function useSchedule() {
  const [state, setState] = useState<State | null>(null);
  useEffect(() => {
    let s: State;
    try {
      const raw = localStorage.getItem(STORAGE);
      s = raw ? { updatedAt: 0, ...JSON.parse(raw) } : { tasks: defaultSchedule(), done: {}, weekKey: weekKey(new Date()), updatedAt: 0 };
    } catch {
      s = { tasks: defaultSchedule(), done: {}, weekKey: weekKey(new Date()), updatedAt: 0 };
    }
    setState(applyWeeklyReset({ ...s, tasks: applyDefaultNotes(s.tasks) }, new Date()));
    const iv = setInterval(() => setState((p) => (p ? applyWeeklyReset(p, new Date()) : p)), 60000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => { if (state) localStorage.setItem(STORAGE, JSON.stringify(state)); }, [state]);
  return [state, setState] as const;
}

type SyncStatus = "loading" | "synced" | "syncing" | "error";

/** Keeps the schedule in sync with the Google Sheet: pulls once on load, pushes on every change (debounced). */
function useSheetSync(state: State | null, setState: React.Dispatch<React.SetStateAction<State | null>>) {
  const [status, setStatus] = useState<SyncStatus>("loading");
  const ready = useRef(false); // true once the initial pull/push settled
  const skipNextPush = useRef(false); // adopting remote state shouldn't echo back
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(async (s: State) => {
    setStatus("syncing");
    try {
      await pushSchedule({ data: { tasks: s.tasks, done: s.done, weekKey: s.weekKey, updatedAt: s.updatedAt } });
      setStatus("synced");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, []);

  // Initial load: pull the sheet; adopt it when newer, otherwise push local state up.
  useEffect(() => {
    if (!state || ready.current) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await pullSchedule();
        if (cancelled) return;
        if (remote && remote.updatedAt > state.updatedAt) {
          skipNextPush.current = true;
          setState(applyWeeklyReset({ ...remote, tasks: applyDefaultNotes({ ...defaultSchedule(), ...remote.tasks }) }, new Date()));
        } else {
          await push({ ...state, updatedAt: Date.now() });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus("error");
      } finally {
        if (!cancelled) ready.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, [state, setState, push]);

  // Push on every local change, debounced.
  useEffect(() => {
    if (!state || !ready.current) return;
    if (skipNextPush.current) { skipNextPush.current = false; return; }
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => void push(state), 1500);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [state, push]);

  const syncNow = useCallback(() => { if (state && ready.current) void push(state); }, [state, push]);
  return { status, syncNow };
}

function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(iv);
  }, []);
  return now;
}

const sortTasks = (t: Task[]) => [...t].sort((a, b) => toMin(a.start) - toMin(b.start));
const fmtDur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}` : `${m}m`);

export function WeeklySchedule() {
  const [state, setState] = useSchedule();
  const now = useNow();
  const [day, setDay] = useState<Day>("Sun");
  const [editing, setEditing] = useState<{ task: Task; isNew: boolean } | null>(null);
  const [details, setDetails] = useState<Task | null>(null);
  const [confirm, setConfirm] = useState<"week" | "defaults" | null>(null);
  const [timerReset, setTimerReset] = useState(0);
  const timer = useTaskTimer(state?.tasks, state?.done, day, `${state?.weekKey ?? ""}-${timerReset}`);
  const sync = useSheetSync(state, setState);

  useEffect(() => { if (now) setDay(todayDay(now)); }, [now === null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return <div className="min-h-screen bg-background" />;

  /** Applies a change and stamps it so the sheet sync knows it's newer. */
  const mutate = (fn: (s: State) => State) => setState((s) => {
    const next = s ? fn(s) : s;
    return next ? { ...next, updatedAt: Date.now() } : next;
  });

  const today = now ? todayDay(now) : null;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;
  const currentTask = today && now ? currentScheduledTask(state.tasks[today], now) : undefined;
  const earlierCount = today && currentTask ? state.tasks[today].filter((task) => toMin(task.start) < toMin(currentTask.start) && !state.done[task.id]).length : 0;
  const currentRunning = currentTask && timer.timer?.taskId === currentTask.id && timer.timer?.day === today && timer.timer?.status === "running";
  const startCurrentTask = () => {
    if (!today || !currentTask) return;
    setDay(today);
    mutate((s) => ({ ...s, done: skipToTask(s.tasks[today], s.done, currentTask.id) }));
    timer.startTask(currentTask, today);
  };
  const progress = (d: Day) => {
    const t = state.tasks[d];
    const n = t.filter((x) => state.done[x.id]).length;
    return { n, total: t.length, pct: t.length ? Math.round((n / t.length) * 100) : 0 };
  };
  const weekTotals = DAYS.reduce((a, d) => { const p = progress(d); return { n: a.n + p.n, t: a.t + p.total }; }, { n: 0, t: 0 });
  const weekPct = weekTotals.t ? Math.round((weekTotals.n / weekTotals.t) * 100) : 0;

  const toggle = (id: string) => {
    timer.complete(id);
    mutate((s) => ({ ...s, done: { ...s.done, [id]: !s.done[id] } }));
  };
  const saveTask = (t: Task) => mutate((s) => {
    const list = s.tasks[day].filter((x) => x.id !== t.id);
    return { ...s, tasks: { ...s.tasks, [day]: sortTasks([...list, t]) } };
  });
  const deleteTask = (id: string) => mutate((s) => ({
    ...s, tasks: { ...s.tasks, [day]: s.tasks[day].filter((x) => x.id !== id) },
  }));

  const dayIdx = DAYS.indexOf(day);

  return (
    <div className="min-h-screen bg-background bg-glow">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
        {/* Header */}
        <header className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="relative min-w-0 flex-1 pr-20 sm:pr-28">
            <img src={plannerIllustration} alt="" width={768} height={768} className="pointer-events-none absolute right-0 top-0 size-20 object-contain sm:size-28" />
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {state.weekKey.replace("-W", " · Week ")}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
              The Week, <span className="text-primary">minute by minute</span>
            </h1>
          </div>
          <div className="flex max-w-full flex-wrap items-center gap-4">
            <div className="w-56">
              <div className="flex justify-between font-mono text-xs text-muted-foreground">
                <span>Week progress</span><span className="text-foreground">{weekPct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${weekPct}%` }} />
              </div>
            </div>
            <button
              onClick={sync.syncNow}
              title={sync.status === "error" ? "Couldn't reach Google Sheets — click to retry" : "Your schedule syncs to your Google Sheet automatically"}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors",
                sync.status === "error"
                  ? "border-destructive/50 text-destructive hover:bg-destructive/10"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {sync.status === "syncing" || sync.status === "loading" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : sync.status === "error" ? (
                <CloudOff className="size-3.5" />
              ) : (
                <Cloud className="size-3.5 text-primary" />
              )}
              {sync.status === "loading" ? "Connecting…" : sync.status === "syncing" ? "Syncing…" : sync.status === "error" ? "Offline — retry" : "Synced to Sheets"}
            </button>
            <Button variant="outline" onClick={() => setConfirm("week")}>
              <RotateCcw /> Reset week
            </Button>
          </div>
        </header>

        {/* Day selector */}
        <nav aria-label="Days of the week" className="mt-10 grid grid-cols-7 gap-1.5 sm:gap-3">
          {DAYS.map((d) => {
            const p = progress(d);
            const active = d === day;
            return (
              <Button
                key={d}
                variant="ghost"
                aria-label={DAY_NAMES[d]}
                aria-pressed={active}
                aria-current={d === today ? "date" : undefined}
                onClick={() => setDay(d)}
                className={cn(
                  "group relative h-auto min-w-0 flex-col items-stretch gap-0 rounded-lg border px-1.5 py-3 text-left transition-all duration-300 sm:p-4",
                  d === today ? "border-primary bg-primary/15 hover:bg-primary/15" : active ? "border-day-selected bg-day-selected/15 hover:bg-day-selected/15" : "border-border bg-card/40 hover:bg-card/80",
                  active && "-translate-y-1 shadow-card",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("font-display text-sm font-semibold sm:text-lg", d === today ? "text-primary" : active ? "text-day-selected" : "text-foreground")}>{d}</span>
                </div>
                <div className="mt-1 hidden font-mono text-xs text-muted-foreground sm:block">{p.n}/{p.total} done</div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full transition-all duration-700", d === today ? "bg-primary" : active ? "bg-day-selected" : "bg-muted-foreground")} style={{ width: `${p.pct}%` }} />
                </div>
              </Button>
            );
          })}
        </nav>

        <TaskTimer controller={timer} tasks={state.tasks[day]} done={state.done} day={day} onComplete={toggle} />

        <section aria-label="Right now" className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Sunrise className="size-4 text-primary" /><h2>Right now</h2>{now && <span className="font-mono text-xs">{DAY_NAMES[today ?? day]} · {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}</div>
            {currentTask ? <div className="mt-2 flex items-start gap-2"><CategoryIcon category={currentTask.cat} className="mt-1" /><div className="min-w-0"><p className="break-words font-semibold">{currentTask.title}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{currentTask.start}–{currentTask.end} · {fmtDur(toMin(currentTask.end) - toMin(currentTask.start))}{state.done[currentTask.id] ? " · Already checked off" : ""}</p>{currentTask.note && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{currentTask.note}</p>}</div></div> : <p className="mt-2 text-sm text-muted-foreground">{now ? "No task scheduled right now" : "Checking local time…"}</p>}
          </div>
          {currentTask && <Button className="max-w-full whitespace-normal text-left" disabled={!!currentRunning} onClick={startCurrentTask}><ChevronRight className="shrink-0" />{currentRunning ? "Current task running" : earlierCount ? `Skip ${earlierCount} earlier tasks & start` : "Start current task"}</Button>}
        </section>

        {/* Day timeline */}
        <section className="mt-8 rounded-3xl border border-border bg-card/60 p-4 shadow-card backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" aria-label="Previous day" onClick={() => setDay(DAYS[(dayIdx + 6) % 7] ?? "Sun")}><ChevronLeft /></Button>
              <h2 className="font-display text-2xl font-semibold">{DAY_NAMES[day]}</h2>
              <Button size="icon" variant="ghost" aria-label="Next day" onClick={() => setDay(DAYS[(dayIdx + 1) % 7] ?? "Sun")}><ChevronRight /></Button>
              <span className="ml-2 font-mono text-sm text-muted-foreground">{progress(day).pct}% complete</span>
            </div>
            <Button
              onClick={() => setEditing({ isNew: true, task: { id: `${day}-${Date.now()}`, start: "17:00", end: "17:30", title: "", cat: "free" } })}
            >
              <Plus /> Add task
            </Button>
          </div>
          <DayTimeline
            key={day}
            tasks={state.tasks[day]}
            done={state.done}
            nowMin={day === today ? nowMin : -1}
            onToggle={toggle}
            onEdit={(t) => setEditing({ task: t, isNew: false })}
            onDetails={setDetails}
            onReorder={(activeId, overId) => mutate((s) => ({ ...s, tasks: { ...s.tasks, [day]: reorderTasks(s.tasks[day], activeId, overId) } }))}
          />
        </section>

        {/* Week overview */}
        <section className="mt-8 rounded-3xl border border-border bg-card/40 p-4 sm:p-6">
          <h2 className="font-display text-xl font-semibold">Week at a glance</h2>
          <div className="mt-5 space-y-2">
            <div className="relative ml-12 h-4 font-mono text-[10px] text-muted-foreground">
              {Array.from({ length: 9 }, (_, i) => 6 + i * 2).map((h) => (
                <span key={h} className="absolute -translate-x-1/2" style={{ left: `${((h * 60 - START) / (END - START)) * 100}%` }}>{String(h).padStart(2, "0")}</span>
              ))}
            </div>
            {DAYS.map((d) => (
              <button key={d} onClick={() => setDay(d)} className="flex w-full items-center gap-3 rounded-lg text-left">
                <span className={cn("w-9 font-mono text-xs", d === day ? "text-primary" : "text-muted-foreground")}>{d}</span>
                <div className={cn("relative h-7 flex-1 overflow-hidden rounded-md bg-muted/50 transition", d === day && "ring-1 ring-primary/50")}>
                  {state.tasks[d].map((t) => {
                    const l = ((toMin(t.start) - START) / (END - START)) * 100;
                    const w = ((toMin(t.end) - toMin(t.start)) / (END - START)) * 100;
                    return (
                      <div key={t.id} title={`${t.start}–${t.end} ${t.title}`}
                        className={cn("absolute inset-y-0.5 rounded-[3px] transition-opacity", BG[t.cat], state.done[t.id] ? "opacity-25" : "opacity-90")}
                        style={{ left: `${l}%`, width: `calc(${w}% - 1px)` }} />
                    );
                  })}
                  {d === today && nowMin >= START && nowMin <= END && (
                    <div className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${((nowMin - START) / (END - START)) * 100}%` }} />
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {(Object.keys(CATEGORIES) as Category[]).map((c) => (
              <span key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CategoryIcon category={c} />{CATEGORIES[c].label}
              </span>
            ))}
          </div>
        </section>

        <CategoryProgress tasks={state.tasks} done={state.done} day={day} />


        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 pb-6 font-mono text-xs text-muted-foreground">
          <span>Check-offs reset automatically every Sunday. Your edits are saved on this device and synced to your Google Sheet.</span>
          <button className="underline-offset-4 hover:text-foreground hover:underline" onClick={() => setConfirm("defaults")}>
            Restore original schedule
          </button>
        </footer>
      </div>

      <TaskDialog
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={(t) => { saveTask(t); setEditing(null); }}
        onDelete={(id) => { deleteTask(id); setEditing(null); }}
      />

      <TaskDetails task={details} onClose={() => setDetails(null)} />

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "week" ? "Start the week fresh?" : "Restore the original schedule?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "week"
                ? "All check marks will be cleared. Your tasks stay as they are."
                : "Your edited tasks and check marks will be replaced by the original plan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setTimerReset((p) => p + 1);
              mutate((s) => (confirm === "week" ? { ...s, done: {} } : { tasks: defaultSchedule(), done: {}, weekKey: s.weekKey, updatedAt: s.updatedAt }));
              setConfirm(null);
            }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DayTimeline({ tasks, done, nowMin, onToggle, onEdit, onDetails, onReorder }: {
  tasks: Task[]; done: Record<string, boolean>; nowMin: number;
  onToggle: (id: string) => void; onEdit: (t: Task) => void; onDetails: (t: Task) => void;
  onReorder: (activeId: string, overId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const sorted = useMemo(() => [...tasks].sort((a, b) => toMin(a.start) - toMin(b.start)), [tasks]);
  const nextId = sorted.find((t) => !done[t.id])?.id;
  const first = useRef(true);

  // Slide finished cards out to the left so the next unfinished card leads the row.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const card = nextId ? el.querySelector<HTMLElement>(`[data-task-id="${nextId}"]`) : null;
    const left = card ? card.offsetLeft - 4 : el.scrollWidth;
    el.scrollTo({ left: Math.max(0, left), behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [nextId, tasks]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); el.scrollBy({ left: e.deltaY * 1.5 }); }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => { if (over) onReorder(String(active.id), String(over.id)); }}>
      <div ref={ref} className="scrollbar-thin relative mt-5 overflow-x-auto pb-3 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex w-max gap-2 px-1 py-2">
          <SortableContext items={sorted.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
            {sorted.map((t) => <SortableTask key={t.id} t={t} done={done} nowMin={nowMin} isNext={t.id === nextId} onToggle={onToggle} onEdit={onEdit} onDetails={onDetails} />)}
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
}

function SortableTask({ t, done, nowMin, isNext, onToggle, onEdit, onDetails }: {
  t: Task; done: Record<string, boolean>; nowMin: number; isNext: boolean;
  onToggle: (id: string) => void; onEdit: (t: Task) => void; onDetails: (t: Task) => void;
}) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: t.id });
  const s = toMin(t.start), e = toMin(t.end);
  const isDone = !!done[t.id];
  const isNow = nowMin >= s && nowMin < e;
  return (
    <div
      ref={setNodeRef}
      data-task-id={t.id}
      role="button"
      aria-label={`${t.title}, ${t.start} to ${t.end}`}
      aria-pressed={isDone}
      tabIndex={0}
      title={`${t.start}–${t.end} · ${t.title}${t.note ? `\n${t.note}` : ""}`}
      onClick={() => onToggle(t.id)}
      onKeyDown={(ev) => ev.target === ev.currentTarget && (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), onToggle(t.id))}
      className={cn(
        "relative h-40 w-44 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-secondary p-2.5 transition-colors duration-300 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isNow && "ring-2 ring-primary",
        isNext && !isNow && "ring-1 ring-day-selected",
        isDragging && "z-30 shadow-card ring-2 ring-day-selected",
        isDone && "bg-muted text-muted-foreground",
      )}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className={cn("absolute inset-x-0 top-0 h-1", BG[t.cat])} />
      {t.note && (
        <Button variant="ghost" size="icon" aria-label={`What is ${t.title}?`} title="What this is & how to do it"
          onClick={(ev) => { ev.stopPropagation(); onDetails(t); }}
          className="absolute right-1 top-1.5 z-10 size-5 shrink-0 rounded-full p-0 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Info className="size-3.5" />
        </Button>
      )}
      <div className="flex h-full min-w-0 flex-col justify-between">
        <div className="min-w-0">
          <div className={cn("flex min-w-0 items-center gap-1.5 font-mono text-[10px] font-medium uppercase", TEXT[t.cat], t.note && "pr-6")}>
            <CategoryIcon category={t.cat} className="size-4" /><span className="truncate">{CATEGORIES[t.cat].label}</span>
          </div>
          <div className={cn("mt-1 line-clamp-3 text-sm font-semibold leading-snug", isDone && "line-through")}>{t.title}</div>
        </div>
        <div className="flex items-end justify-between gap-1">
          <span className="truncate font-mono text-[10px] text-muted-foreground">{t.start} · {fmtDur(e - s)}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" ref={setActivatorNodeRef}
              {...attributes} {...listeners}
              aria-label={`Reorder ${t.title}`} title="Drag to reorder · Space to pick up, arrows to move, Space to drop"
              onClick={(ev) => ev.stopPropagation()}
              className="size-6 shrink-0 cursor-grab touch-none p-1 text-muted-foreground active:cursor-grabbing">
              <GripVertical className="size-4" />
            </Button>
            <Button variant="ghost" aria-label={`Edit ${t.title}`}
              onClick={(ev) => { ev.stopPropagation(); onEdit(t); }}
              className="size-6 p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <Pencil className="size-3" />
            </Button>
            <span className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
              isDone ? "border-primary bg-primary text-primary-foreground" : "border-foreground/30 bg-background/40",
            )}>
              {isDone && <Check className="size-3" />}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskDialog({ editing, onClose, onSave, onDelete }: {
  editing: { task: Task; isNew: boolean } | null;
  onClose: () => void; onSave: (t: Task) => void; onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Task | null>(null);
  useEffect(() => { setDraft(editing ? { ...editing.task } : null); }, [editing]);
  const valid = draft && draft.title.trim() && toMin(draft.end) > toMin(draft.start);

  return (
    <Dialog open={!!editing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing?.isNew ? "New task" : "Edit task"}</DialogTitle></DialogHeader>
        {draft && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={draft.title} autoFocus onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="start">Start</Label>
                <Input id="start" type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">End</Label>
                <Input id="end" type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={draft.cat} onValueChange={(v) => setDraft({ ...draft, cat: v as Category })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORIES) as Category[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="flex items-center gap-2"><CategoryIcon category={c} />{CATEGORIES[c].label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Description</Label>
              <p className="text-xs text-muted-foreground">What this is and how to do it — shown under "Right now" and on the card's info button.</p>
              <Textarea id="note" rows={4} value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </div>
            {draft && toMin(draft.end) <= toMin(draft.start) && <p className="text-sm text-destructive">End time must be after start time.</p>}
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          {editing && !editing.isNew ? (
            <Button variant="ghost" className="text-destructive" onClick={() => onDelete(editing.task.id)}><Trash2 /> Delete</Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}><Undo2 /> Cancel</Button>
            <Button disabled={!valid} onClick={() => draft && onSave({ ...draft, title: draft.title.trim() })}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** What a task is and how to run it, read straight off the schedule note. */
function TaskDetails({ task, onClose }: { task: Task | null; onClose: () => void }) {
  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {task && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className={cn("flex items-center gap-1.5", TEXT[task.cat])}><CategoryIcon category={task.cat} className="size-4" />{CATEGORIES[task.cat].label}</span>
                <span aria-hidden="true">·</span><span>{task.start}–{task.end}</span>
                <span aria-hidden="true">·</span><span>{fmtDur(toMin(task.end) - toMin(task.start))}</span>
              </div>
              <DialogTitle>{task.title}</DialogTitle>
            </DialogHeader>
            {task.note && <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{task.note}</p>}
          </>
        )}
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryProgress({ tasks, done, day }: {
  tasks: Record<Day, Task[]>; done: Record<string, boolean>; day: Day;
}) {
  const [scope, setScope] = useState<"week" | "day">("week");
  const rows = (Object.keys(CATEGORIES) as Category[]).map((c) => {
    const list = (scope === "week" ? DAYS.flatMap((d) => tasks[d]) : tasks[day]).filter((t) => t.cat === c);
    const doneList = list.filter((t) => done[t.id]);
    const mins = (l: Task[]) => l.reduce((a, t) => a + toMin(t.end) - toMin(t.start), 0);
    return { c, total: list.length, n: doneList.length, mins: mins(list), doneMins: mins(doneList) };
  }).filter((r) => r.total > 0);

  return (
    <section className="mt-8 rounded-3xl border border-border bg-card/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">Progress by category</h2>
        <div className="flex rounded-full border border-border bg-muted/40 p-1 font-mono text-xs">
          {(["week", "day"] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)}
              className={cn("rounded-full px-3 py-1 transition", scope === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {s === "week" ? "This week" : DAY_NAMES[day]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((r) => {
          const pct = Math.round((r.n / r.total) * 100);
          return (
            <div key={r.c} className="rounded-2xl border border-border bg-card/60 p-4 transition hover:bg-card">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <CategoryIcon category={r.c} className="size-5" />{CATEGORIES[r.c].label}
                </span>
                <span className={cn("font-mono text-sm", TEXT[r.c])}>{pct}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all duration-700", BG[r.c])} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>{r.n}/{r.total} done</span>
                <span>{fmtDur(r.doneMins)} / {fmtDur(r.mins)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
