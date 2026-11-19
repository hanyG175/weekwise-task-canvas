# Weekwise Task Canvas

A calm, visual weekly planner for turning a routine into an actionable schedule. Weekwise Task Canvas lays out each day horizontally so you can see the shape of your week, adjust tasks in place, and stay focused with a built-in countdown.

## Highlights

- **Horizontal weekly view** for scanning your entire routine at a glance
- **Editable tasks** with start/end times, categories, notes, and completion state
- **Drag-and-drop rescheduling** within a day while preserving task identity and progress
- **Focus timer** with automatic transitions to the next task
- **Today detection** and quick skip/start controls for staying on track
- **Automatic weekly reset** so each new week starts cleanly
- **Optional sound and browser notifications** for timer events
- **Responsive dark interface** that works on desktop and narrow screens
- **Optional Google Sheets sync** for loading and saving schedule data across sessions

## Tech stack

- React 19 and TypeScript
- TanStack Start and TanStack Router
- Vite
- Tailwind CSS
- dnd-kit for accessible drag-and-drop interactions
- Vitest for unit tests

## Getting started

### Requirements

- Node.js 20 or newer
- npm, pnpm, or Bun

### Install and run locally

```bash
git clone https://github.com/hanyG175/weekwise-task-canvas.git
cd weekwise-task-canvas
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Available scripts:

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
npm run test      # Run the test suite
npm run format    # Format the codebase with Prettier
```

If you use Bun, run `bun install` and replace `npm run` with `bun run`.

## Google Sheets sync (optional)

The planner works locally without any external configuration. When enabled, schedule changes are synchronized through the server-side Google Sheets connector; credentials are never requested by browser code.

Set these environment variables in the server or deployment environment:

```bash
LOVABLE_API_KEY=your_lovable_api_key
GOOGLE_SHEETS_API_KEY=your_google_sheets_connection_key
```

The connected spreadsheet must contain one tab for each day (`Sunday` through `Saturday`) and a `Meta` tab. The app creates or updates the expected task columns and uses the newest `updatedAt` value when loading data.

## Deployment

Build the app with:

```bash
npm run build
```

Deploy the generated TanStack Start application to a Node-compatible host. For deployments using Google Sheets sync, configure the two environment variables above as server-side secrets and do not expose them as client-side variables.

## Contributing

Issues and pull requests are welcome. When changing scheduling behavior, add or update focused tests in `src/test` and keep schedule and timer logic browser-safe.

## Acknowledgements

Created by **hanyG175** with [Lovable](https://lovable.dev). Lovable provided the initial development environment and workflow; the source code remains available here for continued development and self-hosting.
