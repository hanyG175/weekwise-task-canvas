export type Category =
  | "prayer" | "quran" | "P" | "O" | "R" | "L" | "A" | "C" | "W"
  | "workout" | "meal" | "rest" | "free" | "routine" | "social";

export interface Task {
  id: string;
  start: string; // "HH:MM"
  end: string;
  title: string;
  cat: Category;
  note?: string | undefined;
}

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type Day = (typeof DAYS)[number];
export const DAY_NAMES: Record<Day, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

export const CATEGORIES: Record<Category, { label: string; short: string }> = {
  prayer: { label: "Prayer", short: "☾" },
  quran: { label: "Quran", short: "Q" },
  P: { label: "Build proof", short: "P" },
  O: { label: "Outreach", short: "O" },
  R: { label: "Roadmap", short: "R" },
  L: { label: "LeetCode", short: "L" },
  A: { label: "Job applications", short: "A" },
  C: { label: "Content", short: "C" },
  W: { label: "Weekly review", short: "W" },
  workout: { label: "Workout", short: "↑" },
  meal: { label: "Meal", short: "◐" },
  rest: { label: "Rest / break", short: "·" },
  free: { label: "Free time", short: "~" },
  routine: { label: "Routine", short: "○" },
  social: { label: "Friends & family", short: "♥" },
};

type Row = [string, string, string, Category, string?];

const SLOT_NOTES: Partial<Record<Category, string>> = {
  P: "Offer C demo (LLM workflow automation) + portfolio projects. Real numbers only.",
  O: "Research 3 prospects, write/send personalized messages, 1 community answer, follow-ups.",
  R: "Roadmap: one stage at a time.",
  L: "50-min session: read, attempt alone, hint, study, rewrite from memory, log.",
  A: "One tailored application + one personal message to someone at that company.",
  C: "Write, record or post content.",
};

/**
 * What each task means and how to run it, taken from the original schedule note.
 * Keyed by task title so the same task reads the same on every day.
 */
const HOW_TO: Record<string, string> = {
  "Wake, water, wudu, curtains": "Wake at 06:00 — the same time every day, weekends included; it's the strongest single lever on your sleep. Water, wudu, open the curtains.",
  "Wake, wudu": "Wake and make wudu. Keep the wake time fixed; weekends move by 30 minutes at most.",
  "Wake, wudu, Fajr": "Wake, wudu, pray Fajr. The wake time holds on weekends too — 30 minutes of drift at most.",
  Fajr: "Pray Fajr (about 10 min). Rule: at the adhan, pause whatever you're doing, pray, resume. Times are estimates — use your mosque's calendar.",
  Dhuhr: "Pray Dhuhr (adhan about 12:23; it barely moves through the year). About 10 min, then back to it.",
  Asr: "Pray Asr (about 15:29 now, roughly a minute earlier each day through December). From about Nov 8 it falls inside the 14:40–15:25 block — just pause 10 minutes there.",
  Maghrib: "Pray Maghrib (about 17:55 now, 17:31 by mid-November). On workout days, pray on arrival at the gym while it's still in time.",
  Isha: "Pray Isha (about 19:16 now, moving earlier).",
  "Quran (~4 pages)": "20 min of Quran after Fajr, about 4 pages. At 4 pages a day a 604-page mushaf takes roughly 5 months — adjust to your own pace.",
  "Quran (25 min)": "25 min of Quran — the weekend extension of the morning read.",
  "Quran: Surah Al-Kahf": "Friday Quran: Surah Al-Kahf (traditionally read on Fridays), plus your usual pages if time allows. About 35 min.",
  "Walk outside + breathing": "10–20 min of outdoor daylight within an hour of waking. First 5 min: slow diaphragmatic breathing — inhale low into the belly, long slow exhale.",
  "Walk at sunrise": "Walk at sunrise — the daylight-within-an-hour-of-waking habit.",
  "Longer walk": "A longer walk outside. Daylight in the first hour after waking is what anchors the sleep schedule.",
  "Speaking: read aloud & listen": "Read aloud for 10 min and record it, then listen back for 5 min. Keep the recordings — the comparison over weeks is the progress.",
  "Speaking: read aloud & record": "Read aloud and record it. Friday's recording is your weekly speaking test.",
  "Speaking practice": "Speaking practice: read aloud, record, listen back. 15 min, every day.",
  Breakfast: "Breakfast at 07:15. Caffeine is fine now — never after 14:00.",
  "Slow breakfast": "Slow breakfast — the weekend's one unhurried thing.",
  "Desk setup, today's top 3": "Set the desk up and write today's top 3 before anything else. If only those three get done, the day still counts.",
  "Top 3": "Write today's top 3 before work starts.",
  "S1 · Build proof": "P — Build proof: the offer C demo (LLM workflow automation) and portfolio projects. Roadmap practice projects count here too. Real numbers only; label demos as demos.",
  "S2 · Build proof": "P — Build proof, block 2. Keep the same project open from S1 instead of starting something new.",
  "S2 · Roadmap": "R — Roadmap, one stage at a time: Stage 0 (logging CLI chatbot) → 1 (context engineering) → 3 (tools & MCP) → 5 (agentic RAG), then 2 when client work needs it.",
  "Build proof": "P — Build proof: keep the project you opened earlier in the day going. Real numbers only; label demos as demos.",
  "Demo #2 / finish demo video": "P — Demo #2, or finish the demo video. This is the thing you post later today, so land it here.",
  "S3 · LeetCode": "L — LeetCode, 50-min session: 0–5 read it, restate it in your own words, write 2 examples · 5–25 attempt it alone, no hints · 25–30 stuck? take one hint, not the solution · 30–40 study a clean solution and why it works · 40–50 close it, rewrite from memory, log the pattern. Cap it at about 4 h/week.",
  "S4 · Roadmap": "R — Roadmap: one stage at a time, in this order: 0 (logging CLI chatbot) → 1 (context engineering) → 3 (tools & MCP) → 5 (agentic RAG), then 2 when client work needs it. If a stage runs a week over, cut the project's scope — don't skip the definition-of-done checks.",
  "S5 · Outreach: research & write": "O — Outreach part 1: research 3 prospects and write 3 personalized messages. Don't send them yet — sending is S6.",
  "S6 · Outreach: send & follow up": "O — Outreach part 2: send those 3 messages, post 1 community answer, submit 1 freelance application, and chase any follow-up older than 4 days.",
  "S7 · Job applications": "A — Job applications: one tailored application (CV tweak plus a short note) and one personal message to someone already at that company.",
  "S3 · Job applications": "A — Job applications: one tailored application (CV tweak plus a short note) and one personal message to someone already at that company.",
  "S7 · Content": "C — Content: write this week's posts. Social feeds only inside C blocks — never before 10:00 or after 21:00.",
  "S4 · Record Shorts voiceovers": "C — Record this week's Shorts voiceovers. This doubles as your weekly speaking test.",
  "Post the demo on LinkedIn/X": "C — Post the demo on LinkedIn and X. This is the week's public proof of work; don't let it slip.",
  "Prospect list + follow-ups": "O — Build the prospect list (40 prospects by the end of week 2) and run the follow-ups.",
  "Weekly review & planning": "W — Weekly review: fill the trackers, check next week's prayer times and shift S6/S7 if Asr crept into a block, change one thing, plan the top 3. Ask: did I protect sleep, workouts and the free half-days? What am I proud of this week?",
  "LeetCode: re-solve 2, 1 timed new": "L — Sunday session: re-solve 2 problems from last week from scratch (about 20 min), then 1 timed new problem (about 30 min).",
  Break: "Stand up, get water, look out the window. No phone — a break only counts if it's off-screen.",
  "Long break": "A real break: walk, tea, stretch. Still no phone, and no caffeine after 14:00.",
  "Long break: walk, tea": "A real break: walk, tea, stretch. Still no phone, and no caffeine after 14:00.",
  "Break & wudu": "Break and wudu — you're heading into Dhuhr.",
  "Buffer & wudu": "Buffer and wudu before Dhuhr.",
  "Break and wudu": "Break and wudu — you're heading into Dhuhr.",
  "Lunch, away from desk": "Lunch away from the desk — actually away. Keep the last big meal 2+ hours before bed.",
  Lunch: "Lunch, away from the desk.",
  "Rest / nap ≤20 min": "Nap 20 min at most, or just eyes closed with no screen. Never later than 14:00 or it costs tonight's sleep.",
  "Snack & water": "Snack and water, away from the desk. Work stopped at 16:30 — this is the boundary, don't cross it back.",
  "S8 · Buffer (catch up or rest)": "S8 buffer: catch up on whatever slipped this week. If nothing slipped, rest — don't invent work to fill it.",
  "Paper book / quiet reset": "Quiet reset before the gym: paper book, no screens. Pre-workout snack already eaten.",
  "Gym bag, travel": "Pack the gym bag and travel over.",
  "Gym prep & travel": "Gym prep and travel — 45 min, unhurried.",
  Workout: "Workout 18:00–19:00. Sun/Tue/Thu/Sat with a rest day between each; swap days if your gym needs it.",
  "Shower, travel home": "Shower and travel home.",
  Dinner: "Dinner at 19:30. Keep the last big meal 2+ hours before bed.",
  "Dinner (protein + carbs)": "Post-workout dinner: protein plus carbs.",
  "Light dinner": "Light dinner.",
  "Free": "Genuinely free. Aim for one real human contact a day — a call, a message, a person.",
  "Free, wudu": "Free until Maghrib; make wudu near the end.",
  "Free: walk, call family, hobby": "Long walk, call family or a friend, cook, hobby. One real human contact a day is a requirement, not a nice-to-have.",
  "Free: family, friends, hobby": "Free: family, friends, hobby. No work.",
  "Free, no work": "Free, no work. Friday is the day that keeps the week sane — protect it.",
  "Free: book, rest, tidy up": "Book, rest, tidy up.",
  "Free half-day: nap, book, family": "Free half-day: nap 20 min at most, book 60 min, family or friends, errands. Asr at 15:25–15:40.",
  "Free half-day: chores, nap, book": "Free half-day: chores 45 min, nap 20 min at most, book 60 min, family. Asr at 15:25–15:40.",
  "Free: errands, book (60 min)": "Errands, or 60 min of book.",
  "Free: family, book": "Family, or a book.",
  "Get ready for Jumu'ah": "Get ready for Jumu'ah. Work stops for the week at noon — nothing work-shaped after this.",
  "Jumu'ah": "Jumu'ah — follow your mosque's timing.",
  "Head out": "Head out to meet friends.",
  "Friends (Maghrib with them)": "Friends, 17:00–19:00. Pray Maghrib with them.",
  Home: "Home.",
  "Log trackers, tomorrow's top 3": "Last screen task of the day: fill the habit tracker (5 prayers, Quran, speaking 15 min, workout, book 30 min, LeetCode, 3 outreach messages, job application, lights out on time, screens off 21:00) and write tomorrow's top 3.",
  "Screens off · Paper book": "Screens off at 21:00, lights low. 30 min of a paper book — paper only; technical reading belongs in the R slots.",
  "Stretch, breathing, journal": "Stretch 10 min, slow breathing 5 min, journal 5 min: 3 wins from today plus tomorrow's first task.",
  "Wash up, adhkar, lay out clothes": "Wash up, bedtime adhkar/dua, lay out tomorrow's clothes.",
  "In bed, lights low → lights out 22:15": "In bed, lights low. Lights out 22:15, wake 06:00 — 7h45. Can't sleep within 20–30 min? Get up, dim light, paper book, back to bed when sleepy. No phone.",
  "Lay out clothes for Monday": "Lay out Monday's clothes. Small thing, makes the 06:00 wake-up easier.",
};

const morning: Row[] = [
  ["06:00", "06:10", "Wake, water, wudu, curtains", "routine"],
  ["06:10", "06:20", "Fajr", "prayer"],
  ["06:20", "06:40", "Quran (~4 pages)", "quran"],
  ["06:40", "07:00", "Walk outside + breathing", "routine"],
  ["07:00", "07:15", "Speaking: read aloud & listen", "routine"],
  ["07:15", "07:45", "Breakfast", "meal"],
  ["07:45", "08:00", "Desk setup, today's top 3", "routine"],
];


function coreDay(s7: Category, s8Buffer: boolean, workout: boolean): Row[] {
  const rows: Row[] = [
    ...morning,
    ["08:00", "08:50", "S1 · Build proof", "P"],
    ["08:50", "09:00", "Break", "rest"],
    ["09:00", "09:50", "S2 · Build proof", "P"],
    ["09:50", "10:10", "Long break: walk, tea", "rest"],
    ["10:10", "11:00", "S3 · LeetCode", "L"],
    ["11:00", "11:10", "Break", "rest"],
    ["11:10", "12:00", "S4 · Roadmap", "R"],
    ["12:00", "12:20", "Break & wudu", "rest"],
    ["12:20", "12:35", "Dhuhr", "prayer"],
    ["12:35", "13:20", "Lunch, away from desk", "meal"],
    ["13:20", "13:40", "Rest / nap ≤20 min", "rest"],
    ["13:40", "14:30", "S5 · Outreach: research & write", "O"],
    ["14:30", "14:40", "Break", "rest"],
    ["14:40", "15:25", "S6 · Outreach: send & follow up", "O"],
    ["15:25", "15:40", "Asr", "prayer"],
    ["15:40", "16:30", `S7 · ${CATEGORIES[s7].label}`, s7],
    ["16:30", "16:45", "Snack & water", "meal"],
  ];
  if (!workout) {
    rows.push(
      ["16:45", "17:35", s8Buffer ? "S8 · Buffer (catch up or rest)" : "Free", s8Buffer ? "rest" : "free"],
      ["17:35", "17:50", "Free, wudu", "free"],
      ["17:50", "18:00", "Maghrib", "prayer"],
      ["18:00", "19:15", "Free: walk, call family, hobby", "social"],
      ["19:15", "19:25", "Isha", "prayer"],
      ["19:30", "20:10", "Dinner", "meal"],
      ["20:10", "20:45", "Free: family, friends, hobby", "free"],
    );
  } else {
    rows.push(
      ["16:45", "17:15", "Paper book / quiet reset", "free"],
      ["17:15", "17:45", "Gym bag, travel", "routine"],
      ["17:45", "18:00", "Maghrib", "prayer"],
      ["18:00", "19:00", "Workout", "workout"],
      ["19:00", "19:30", "Shower, travel home", "routine"],
      ["19:30", "19:40", "Isha", "prayer"],
      ["19:45", "20:25", "Dinner (protein + carbs)", "meal"],
      ["20:25", "20:45", "Free", "free"],
    );
  }
  return rows;
}

const windDown: Row[] = [
  ["20:45", "21:00", "Log trackers, tomorrow's top 3", "routine"],
  ["21:00", "21:30", "Screens off · Paper book", "free"],
  ["21:30", "21:50", "Stretch, breathing, journal", "routine"],
  ["21:50", "22:05", "Wash up, adhkar, lay out clothes", "routine"],
  ["22:05", "22:15", "In bed, lights low → lights out 22:15", "rest"],
];

const friday: Row[] = [
  ["06:00", "06:10", "Wake, wudu", "routine"],
  ["06:10", "06:20", "Fajr", "prayer"],
  ["06:20", "06:55", "Quran: Surah Al-Kahf", "quran"],
  ["06:55", "07:10", "Walk at sunrise", "routine"],
  ["07:10", "07:25", "Speaking: read aloud & record", "routine"],
  ["07:25", "07:55", "Breakfast", "meal"],
  ["07:55", "08:00", "Top 3", "routine"],
  ["08:00", "08:50", "S1 · Build proof", "P"],
  ["08:50", "09:00", "Break", "rest"],
  ["09:00", "09:50", "S2 · Roadmap", "R"],
  ["09:50", "10:10", "Long break", "rest"],
  ["10:10", "11:00", "S3 · Job applications", "A"],
  ["11:00", "11:10", "Break", "rest"],
  ["11:10", "12:00", "S4 · Record Shorts voiceovers", "C"],
  ["12:00", "12:20", "Get ready for Jumu'ah", "routine"],
  ["12:20", "13:30", "Jumu'ah", "prayer"],
  ["13:30", "14:15", "Lunch", "meal"],
  ["14:15", "14:35", "Rest / nap ≤20 min", "rest"],
  ["14:35", "15:25", "Free, no work", "free"],
  ["15:25", "15:40", "Asr", "prayer"],
  ["15:40", "16:45", "Free: book, rest, tidy up", "free"],
  ["16:45", "17:00", "Head out", "routine"],
  ["17:00", "19:00", "Friends (Maghrib with them)", "social"],
  ["19:00", "19:15", "Home", "routine"],
  ["19:15", "19:25", "Isha", "prayer"],
  ["19:30", "20:15", "Light dinner", "meal"],
  ["20:15", "20:45", "Free", "free"],
];

const weekendMorning: Row[] = [
  ["06:00", "06:20", "Wake, wudu, Fajr", "prayer"],
  ["06:20", "06:45", "Quran (25 min)", "quran"],
  ["06:45", "07:15", "Longer walk", "routine"],
  ["07:15", "07:30", "Speaking practice", "routine"],
  ["07:30", "08:30", "Slow breakfast", "meal"],
  ["08:30", "09:00", "Free", "free"],
];

const weekendEvening: Row[] = [
  ["17:00", "17:45", "Gym prep & travel", "routine"],
  ["17:45", "18:00", "Maghrib", "prayer"],
  ["18:00", "19:00", "Workout", "workout"],
  ["19:00", "19:30", "Shower, travel home", "routine"],
  ["19:30", "19:40", "Isha", "prayer"],
  ["19:45", "20:30", "Dinner", "meal"],
];

const saturday: Row[] = [
  ...weekendMorning,
  ["09:00", "09:50", "Demo #2 / finish demo video", "P"],
  ["09:50", "10:10", "Break", "rest"],
  ["10:10", "11:00", "Build proof", "P"],
  ["11:00", "11:10", "Break", "rest"],
  ["11:10", "12:00", "Post the demo on LinkedIn/X", "C"],
  ["12:00", "12:20", "Break & wudu", "rest"],
  ["12:20", "12:35", "Dhuhr", "prayer"],
  ["12:35", "13:30", "Lunch", "meal"],
  ["13:30", "15:25", "Free half-day: nap, book, family", "free"],
  ["15:25", "15:40", "Asr", "prayer"],
  ["15:40", "17:00", "Free: errands, book (60 min)", "free"],
  ...weekendEvening,
  ["20:30", "20:45", "Free", "free"],
];

const sunday: Row[] = [
  ...weekendMorning,
  ["09:00", "10:00", "Weekly review & planning", "W"],
  ["10:00", "10:15", "Break", "rest"],
  ["10:15", "11:05", "Prospect list + follow-ups", "O"],
  ["11:05", "11:20", "Break", "rest"],
  ["11:20", "12:10", "LeetCode: re-solve 2, 1 timed new", "L"],
  ["12:10", "12:25", "Buffer & wudu", "rest"],
  ["12:25", "12:40", "Dhuhr", "prayer"],
  ["12:40", "13:30", "Lunch", "meal"],
  ["13:30", "15:25", "Free half-day: chores, nap, book", "free"],
  ["15:25", "15:40", "Asr", "prayer"],
  ["15:40", "17:00", "Free: family, book", "free"],
  ...weekendEvening,
  ["20:30", "20:45", "Lay out clothes for Monday", "routine"],
];

function build(day: Day, rows: Row[]): Task[] {
  return [...rows, ...windDown].map(([start, end, title, cat, note], i) => ({
    id: `${day}-${i}`,
    start, end, title, cat,
    note: note ?? HOW_TO[title] ?? SLOT_NOTES[cat],
  }));
}

export function defaultSchedule(): Record<Day, Task[]> {
  return {
    Mon: build("Mon", coreDay("A", true, false)),
    Tue: build("Tue", coreDay("C", false, true)),
    Wed: build("Wed", coreDay("A", true, false)),
    Thu: build("Thu", coreDay("A", false, true)),
    Fri: build("Fri", friday),
    Sat: build("Sat", saturday),
    Sun: build("Sun", sunday),
  };
}

/** The one-line defaults shipped with the first version of the schedule. */
const LEGACY_NOTES = new Set(Object.values(SLOT_NOTES).filter((v): v is string => !!v));

/**
 * Refreshes descriptions on a saved schedule: a task still carrying an empty or
 * original one-line default gets the current description for its title.
 * Notes you wrote yourself are left untouched.
 */
export function applyDefaultNotes(tasks: Record<Day, Task[]>): Record<Day, Task[]> {
  const defaults = defaultSchedule();
  const byTitle = new Map<string, string>();
  for (const d of DAYS) for (const t of defaults[d]) if (t.note && !byTitle.has(t.title)) byTitle.set(t.title, t.note);
  const out = {} as Record<Day, Task[]>;
  for (const d of DAYS) out[d] = (tasks[d] ?? []).map((t) =>
    t.note && !LEGACY_NOTES.has(t.note) ? t : { ...t, note: byTitle.get(t.title) ?? t.note },
  );
  return out;
}

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Sunday-start week key, numbered by the ISO week of its following Monday. */
export function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Clears check-offs when a new week has started; tasks themselves are kept. */
export function applyWeeklyReset<T extends { weekKey: string; done: Record<string, boolean> }>(
  state: T, now: Date,
): T {
  const k = weekKey(now);
  return state.weekKey === k ? state : { ...state, weekKey: k, done: {} };
}

export function todayDay(now: Date): Day {
  return DAYS[now.getDay()] ?? "Sun";
}

/** Move a task into another position, retaining durations, gaps and check-off IDs. */
export function reorderTasks(tasks: Task[], activeId: string, overId: string): Task[] {
  const sorted = [...tasks].sort((a, b) => toMin(a.start) - toMin(b.start));
  const from = sorted.findIndex((t) => t.id === activeId);
  const to = sorted.findIndex((t) => t.id === overId);
  if (from < 0 || to < 0 || from === to) return tasks;
  const gaps = sorted.map((t, i) => i ? toMin(t.start) - toMin(sorted[i - 1]?.end ?? t.start) : 0);
  const moved = sorted.splice(from, 1)[0];
  if (!moved) return tasks;
  sorted.splice(to, 0, moved);
  let cursor = Math.min(...tasks.map((t) => toMin(t.start)));
  const time = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return sorted.map((t, i) => {
    cursor += gaps[i] ?? 0;
    const duration = toMin(t.end) - toMin(t.start);
    const result = { ...t, start: time(cursor), end: time(cursor + duration) };
    cursor += duration;
    return result;
  });
}
