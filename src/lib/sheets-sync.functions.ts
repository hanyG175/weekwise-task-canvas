import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CATEGORIES, DAYS, type Category, type Day, type Task } from "@/lib/schedule-data";

const SPREADSHEET_ID = "1UlCYPY2oFU--_36ZQfXHL1OM8zuO7Kl1yncW-2WGL8Y";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
const MAX_ROWS = 60; // pad each day tab so shrinking a day clears stale rows

const categorySchema = z.enum(Object.keys(CATEGORIES) as [Category, ...Category[]]);
const taskSchema = z.object({
  id: z.string().min(1).max(80),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  title: z.string().min(1).max(200),
  cat: categorySchema,
  note: z.string().max(1000).optional(),
});
const pushSchema = z.object({
  tasks: z.record(z.enum(DAYS as unknown as [Day, ...Day[]]), z.array(taskSchema).max(MAX_ROWS)),
  done: z.record(z.string(), z.boolean()),
  weekKey: z.string().max(20),
  updatedAt: z.number(),
});

export interface SheetSnapshot {
  tasks: Record<Day, Task[]>;
  done: Record<string, boolean>;
  weekKey: string;
  updatedAt: number;
}

async function sheetsFetch(path: string, init?: RequestInit): Promise<Response> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connectionKey) throw new Error("Google Sheets connection is not configured");
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Sheets request failed [${res.status}]: ${body}`);
    throw new Error(`Google Sheets request failed [${res.status}]: ${body}`);
  }
  return res;
}

function dayRows(tasks: Task[], done: Record<string, boolean>): string[][] {
  const header = ["id", "start", "end", "title", "category", "note", "done"];
  const rows = tasks.map((t) => [
    t.id, t.start, t.end, t.title, t.cat, t.note ?? "", done[t.id] ? "1" : "",
  ]);
  const out = [header, ...rows];
  while (out.length < MAX_ROWS) out.push(["", "", "", "", "", "", ""]);
  return out;
}

export const pushSchedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => pushSchema.parse(input))
  .handler(async ({ data }) => {
    const ranges = DAYS.map((d) => ({
      range: `${d}!A1:G${MAX_ROWS}`,
      values: dayRows(data.tasks[d] ?? [], data.done),
    }));
    ranges.push({
      range: "Meta!A1:B2",
      values: [
        ["weekKey", data.weekKey],
        ["updatedAt", String(data.updatedAt)],
      ],
    });
    await sheetsFetch(`/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`, {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "RAW", data: ranges }),
    });
    return { ok: true as const };
  });

function parseDay(values: string[][] | undefined): Task[] {
  if (!values || values.length < 2) return [];
  const tasks: Task[] = [];
  for (const row of values.slice(1)) {
    const [id, start, end, title, cat, note] = row;
    if (!id || !start || !end || !title) continue;
    const parsed = taskSchema.safeParse({ id, start, end, title, cat, note: note || undefined });
    if (parsed.success) tasks.push(parsed.data);
  }
  return tasks;
}

export const pullSchedule = createServerFn({ method: "GET" }).handler(async (): Promise<SheetSnapshot | null> => {
  const ranges = [...DAYS.map((d) => `${d}!A1:G${MAX_ROWS}`), "Meta!A1:B2"];
  const query = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join("&");
  const res = await sheetsFetch(`/spreadsheets/${SPREADSHEET_ID}/values:batchGet?${query}`);
  const json = (await res.json()) as { valueRanges?: { range: string; values?: string[][] }[] };
  const byRange = new Map(json.valueRanges?.map((vr) => [vr.range, vr.values]) ?? []);

  const meta = byRange.get("Meta!A1:B2");
  const weekKeyValue = meta?.[0]?.[1];
  const updatedAtValue = Number(meta?.[1]?.[1]);
  if (!weekKeyValue || !Number.isFinite(updatedAtValue) || updatedAtValue <= 0) return null; // fresh sheet

  const tasks = {} as Record<Day, Task[]>;
  const done: Record<string, boolean> = {};
  for (const d of DAYS) {
    const values = byRange.get(`${d}!A1:G${MAX_ROWS}`);
    tasks[d] = parseDay(values);
    values?.slice(1).forEach((row) => {
      if (row[0] && row[6] === "1") done[row[0]] = true;
    });
  }
  return { tasks, done, weekKey: weekKeyValue, updatedAt: updatedAtValue };
});
