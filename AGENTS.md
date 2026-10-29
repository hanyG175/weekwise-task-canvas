<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use dnd-kit handles for pointer, touch and keyboard task reordering; reschedule within a day while preserving durations, positional gaps and task IDs so progress remains attached to tasks.
- Keep week boundaries and task reorder logic in the browser-safe schedule data module with targeted unit tests so day navigation and resets stay consistent.
- Keep countdown calculations in a browser-safe pure timer module; run audio and notification APIs only after interaction/effects, using wall-clock deadlines so background throttling does not accumulate drift.
- Keep local-time task detection and skip-to-task check-offs in the browser-safe timer module with targeted tests; the shortcut uses today's schedule independently of the selected day and starts the full task duration.
- Schedule state syncs to the user's Google Sheet (spreadsheet ID in src/lib/sheets-sync.functions.ts) via the gateway-backed Google Sheets connector: server functions read LOVABLE_API_KEY and GOOGLE_SHEETS_API_KEY inside handlers, newest `updatedAt` wins on load, and local edits push debounced — never call the Sheets API from browser code.
