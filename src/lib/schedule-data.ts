export type Category =
  | "prayer" | "quran" | "P" | "O" | "R" | "L" | "A" | "C" | "W"
  | "workout" | "meal" | "rest" | "free" | "routine" | "social";

export interface Task {
  id: string;
  start: string; // "HH:MM"
  end: string;
  title: string;
  cat: Category;
  note?: string;
}

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
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

const morning: Row[] = [
  ["06:00", "06:10", "Wake, water, wudu, curtains", "routine"],
  ["06:10", "06:20", "Fajr", "prayer"],
  ["06:20", "06:40", "Quran (~4 pages)", "quran"],
  ["06:40", "07:00", "Walk outside + breathing", "routine"],
  ["07:00", "07:15", "Speaking: read aloud & listen", "routine"],
  ["07:15", "07:45", "Breakfast", "meal"],
  ["07:45", "08:00", "Desk setup, today's top 3", "routine"],
];

const SLOTS: Record<string, Record<"Mon" | "Tue" | "Wed" | "Thu", Category | null>> = {
  S5: { Mon: "O", Tue: "O", Wed: "O", Thu: "O" },
};

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
void SLOTS;

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
    note: note ?? SLOT_NOTES[cat],
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

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** ISO-week key like "2026-W43"; weeks start Monday. */
export function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
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
  return DAYS[(now.getDay() + 6) % 7];
}
