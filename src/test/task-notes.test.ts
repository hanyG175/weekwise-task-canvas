import { describe, expect, it } from "vitest";
import { applyDefaultNotes, defaultSchedule, type Day, type Task } from "@/lib/schedule-data";

const schedule = defaultSchedule();
const find = (day: Day, title: string) => schedule[day].find((t) => t.title === title);

describe("task descriptions", () => {
  it("explains the focus slots the way the original note does", () => {
    expect(find("Mon", "S3 · LeetCode")?.note).toContain("write 2 examples");
    expect(find("Mon", "S5 · Outreach: research & write")?.note).toContain("Don't send them yet");
    expect(find("Mon", "S4 · Roadmap")?.note).toContain("definition-of-done");
    expect(find("Sun", "Weekly review & planning")?.note).toContain("trackers");
  });

  it("gives every default task a description", () => {
    for (const day of Object.keys(schedule) as Day[]) {
      for (const t of schedule[day]) expect(t.note, `${day} · ${t.title}`).toBeTruthy();
    }
  });

  it("refreshes saved tasks still carrying the old one-line defaults, keeping your own wording", () => {
    const saved: Record<Day, Task[]> = {
      ...schedule,
      Mon: [
        { id: "Mon-0", start: "10:10", end: "11:00", title: "S3 · LeetCode", cat: "L", note: "50-min session: read, attempt alone, hint, study, rewrite from memory, log." },
        { id: "Mon-1", start: "08:00", end: "08:50", title: "S1 · Build proof", cat: "P" },
        { id: "Mon-2", start: "09:00", end: "09:50", title: "My own thing", cat: "free", note: "Call the landlord about the radiator." },
      ],
    };
    const notes = applyDefaultNotes(saved).Mon.map((t) => t.note);
    expect(notes[0]).toContain("write 2 examples");
    expect(notes[1]).toContain("offer C demo");
    expect(notes[2]).toBe("Call the landlord about the radiator.");
  });
});
