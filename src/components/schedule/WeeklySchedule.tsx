import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Plus, RotateCcw, Trash2, Undo2, ChevronLeft, ChevronRight } from "lucide-react";
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
  CATEGORIES, DAYS, DAY_NAMES, applyWeeklyReset, defaultSchedule, toMin, todayDay, weekKey,
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

const START = 6 * 60;
const END = 22 * 60 + 30;
const PX = 4; // px per minute in day view
const STORAGE = "weekly-schedule-v1";

interface State { tasks: Record<Day, Task[]>; done: Record<string, boolean>; weekKey: string }

function useSchedule() {
  const [state, setState] = useState<State | null>(null);
  useEffect(() => {
    let s: State;
    try {
      const raw = localStorage.getItem(STORAGE);
      s = raw ? JSON.parse(raw) : { tasks: defaultSchedule(), done: {}, weekKey: weekKey(new Date()) };
    } catch {
      s = { tasks: defaultSchedule(), done: {}, weekKey: weekKey(new Date()) };
    }
    setState(applyWeeklyReset(s, new Date()));
    const iv = setInterval(() => setState((p) => (p ? applyWeeklyReset(p, new Date()) : p)), 60000);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => { if (state) localStorage.setItem(STORAGE, JSON.stringify(state)); }, [state]);
  return [state, setState] as const;
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
  const [day, setDay] = useState<Day>("Mon");
  const [editing, setEditing] = useState<{ task: Task; isNew: boolean } | null>(null);
  const [confirm, setConfirm] = useState<"week" | "defaults" | null>(null);

  useEffect(() => { if (now) setDay(todayDay(now)); }, [now === null]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return <div className="min-h-screen bg-background" />;

  const today = now ? todayDay(now) : null;
  const nowMin = now ? now.getHours() * 60 + now.getMinutes() : -1;
  const progress = (d: Day) => {
    const t = state.tasks[d];
    const n = t.filter((x) => state.done[x.id]).length;
    return { n, total: t.length, pct: t.length ? Math.round((n / t.length) * 100) : 0 };
  };
  const weekTotals = DAYS.reduce((a, d) => { const p = progress(d); return { n: a.n + p.n, t: a.t + p.total }; }, { n: 0, t: 0 });
  const weekPct = weekTotals.t ? Math.round((weekTotals.n / weekTotals.t) * 100) : 0;

  const toggle = (id: string) => setState((s) => s && { ...s, done: { ...s.done, [id]: !s.done[id] } });
  const saveTask = (t: Task) => setState((s) => {
    if (!s) return s;
    const list = s.tasks[day].filter((x) => x.id !== t.id);
    return { ...s, tasks: { ...s.tasks, [day]: sortTasks([...list, t]) } };
  });
  const deleteTask = (id: string) => setState((s) => s && {
    ...s, tasks: { ...s.tasks, [day]: s.tasks[day].filter((x) => x.id !== id) },
  });

  const dayIdx = DAYS.indexOf(day);

  return (
    <div className="min-h-screen bg-background bg-glow">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {state.weekKey.replace("-W", " · Week ")}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              The Week, <span className="text-primary">minute by minute</span>
            </h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-56">
              <div className="flex justify-between font-mono text-xs text-muted-foreground">
                <span>Week progress</span><span className="text-foreground">{weekPct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${weekPct}%` }} />
              </div>
            </div>
            <Button variant="outline" onClick={() => setConfirm("week")}>
              <RotateCcw /> Reset week
            </Button>
          </div>
        </header>

        {/* Day selector */}
        <nav className="mt-10 grid grid-cols-7 gap-2 sm:gap-3">
          {DAYS.map((d) => {
            const p = progress(d);
            const active = d === day;
            return (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 sm:p-4",
                  active ? "border-primary/60 bg-card shadow-card -translate-y-1" : "border-border bg-card/40 hover:bg-card/80 hover:-translate-y-0.5",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("font-display text-sm font-semibold sm:text-lg", active && "text-primary")}>{d}</span>
                  {d === today && <span className="hidden rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] uppercase text-primary sm:inline">Today</span>}
                </div>
                <div className="mt-1 hidden font-mono text-xs text-muted-foreground sm:block">{p.n}/{p.total} done</div>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all duration-700" style={{ width: `${p.pct}%` }} />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Day timeline */}
        <section className="mt-8 rounded-3xl border border-border bg-card/60 p-4 shadow-card backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" aria-label="Previous day" onClick={() => setDay(DAYS[(dayIdx + 6) % 7])}><ChevronLeft /></Button>
              <h2 className="font-display text-2xl font-semibold">{DAY_NAMES[day]}</h2>
              <Button size="icon" variant="ghost" aria-label="Next day" onClick={() => setDay(DAYS[(dayIdx + 1) % 7])}><ChevronRight /></Button>
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
          />
          <p className="mt-3 font-mono text-xs text-muted-foreground">Click a block to check it off · scroll sideways to move through the day · pencil to edit</p>
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
                <span className={cn("size-2.5 rounded-full", BG[c])} />{CATEGORIES[c].label}
              </span>
            ))}
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 pb-6 font-mono text-xs text-muted-foreground">
          <span>Check-offs reset automatically every Monday. Your edits are saved on this device.</span>
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
              setState((s) => s && (confirm === "week" ? { ...s, done: {} } : { tasks: defaultSchedule(), done: {}, weekKey: s.weekKey }));
              setConfirm(null);
            }}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DayTimeline({ tasks, done, nowMin, onToggle, onEdit }: {
  tasks: Task[]; done: Record<string, boolean>; nowMin: number;
  onToggle: (id: string) => void; onEdit: (t: Task) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const width = (END - START) * PX;
  const hours = useMemo(() => Array.from({ length: 17 }, (_, i) => 6 + i), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = nowMin >= START ? (nowMin - START) * PX - el.clientWidth / 3 : 0;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); el.scrollBy({ left: e.deltaY * 1.5 }); }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} className="scrollbar-thin mt-5 overflow-x-auto pb-3 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="relative" style={{ width }}>
        {/* ruler */}
        <div className="relative h-6 border-b border-border">
          {hours.map((h) => (
            <span key={h} className="absolute top-0 -translate-x-1/2 font-mono text-[11px] text-muted-foreground" style={{ left: (h * 60 - START) * PX }}>
              {String(h).padStart(2, "0")}:00
            </span>
          ))}
        </div>
        <div className="relative h-44">
          {hours.map((h) => (
            <div key={h} className="absolute inset-y-0 w-px bg-border" style={{ left: (h * 60 - START) * PX }} />
          ))}
          {tasks.map((t) => {
            const s = toMin(t.start), e = toMin(t.end);
            const w = (e - s) * PX;
            const isDone = !!done[t.id];
            const isNow = nowMin >= s && nowMin < e;
            const narrow = w < 90;
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                title={`${t.start}–${t.end} · ${t.title}${t.note ? `\n${t.note}` : ""}`}
                onClick={() => onToggle(t.id)}
                onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && (ev.preventDefault(), onToggle(t.id))}
                className={cn(
                  "group absolute top-3 bottom-3 cursor-pointer overflow-hidden rounded-xl border border-border bg-secondary/70 p-2.5 transition-all duration-300 hover:-translate-y-1 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isNow && "ring-2 ring-primary",
                  isDone && "opacity-45",
                )}
                style={{ left: (s - START) * PX + 1, width: w - 3 }}
              >
                <div className={cn("absolute inset-x-0 top-0 h-1", BG[t.cat])} />
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className={cn("font-mono text-[10px] font-medium uppercase tracking-wider", TEXT[t.cat])}>
                      {narrow ? CATEGORIES[t.cat].short : CATEGORIES[t.cat].label}
                    </div>
                    <div className={cn("mt-1 text-sm font-semibold leading-snug", narrow && "[writing-mode:vertical-rl] mt-2 text-xs", isDone && "line-through")}>
                      {narrow && w < 45 ? "" : t.title}
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-1">
                    {!narrow && <span className="font-mono text-[10px] text-muted-foreground">{t.start} · {fmtDur(e - s)}</span>}
                    <div className="flex items-center gap-1">
                      <button
                        aria-label={`Edit ${t.title}`}
                        onClick={(ev) => { ev.stopPropagation(); onEdit(t); }}
                        className="rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <span className={cn(
                        "flex size-5 items-center justify-center rounded-full border transition-all duration-300",
                        isDone ? "scale-100 border-primary bg-primary text-primary-foreground" : "border-border",
                      )}>
                        {isDone && <Check className="size-3" />}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {nowMin >= START && nowMin <= END && (
            <div className="pointer-events-none absolute -top-6 bottom-0 z-10" style={{ left: (nowMin - START) * PX }}>
              <div className="h-full w-0.5 bg-primary" />
              <div className="absolute -top-1 -left-1 size-2.5 animate-pulse rounded-full bg-primary" />
            </div>
          )}
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
                      <span className="flex items-center gap-2"><span className={cn("size-2.5 rounded-full", BG[c])} />{CATEGORIES[c].label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Notes</Label>
              <Textarea id="note" rows={3} value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
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
