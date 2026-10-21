import { createFileRoute } from "@tanstack/react-router";
import { WeeklySchedule } from "@/components/schedule/WeeklySchedule";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weekly Schedule — Minute by Minute" },
      { name: "description", content: "An interactive horizontal weekly schedule: check off tasks, edit your days and start fresh every week." },
      { property: "og:title", content: "Weekly Schedule — Minute by Minute" },
      { property: "og:description", content: "Interactive weekly routine with prayers, focus slots, workouts and rest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WeeklySchedule,
});
