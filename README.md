# TaskFlow Team Board

TaskFlow is a responsive task-management interface for organizing work across a kanban board, a personal task list, and a calendar. It includes task search and filters, task editing, keyboard-accessible task movement, theme preferences, and local browser persistence.

## Features

- Organize tasks in **To Do**, **In Progress**, and **Done** columns.
- Create, edit, and delete tasks with title, description, status, label, priority, and due date fields.
- Drag tasks between columns and reorder them; keyboard users can move tasks with the arrow keys.
- Search and filter tasks by status, priority, and label. Filter values are reflected in the URL.
- View shared task data in Board, My Tasks, and Calendar sections.
- Save tasks and selected preferences in `localStorage`; synchronize task changes across same-origin tabs.
- Use light, dark, or system theme preferences and reduced-motion settings.
- Review task movement instructions, keyboard shortcuts, and progress summaries in the help and progress sections.

## Technologies

- React 19 and JavaScript (ES modules, JSX)
- Vite for development and production builds
- CSS for layout, themes, responsive rules, and reduced-motion support
- lucide-react for icons
- Vitest, jsdom, React Testing Library, and `user-event` for tests
- ESLint for linting

## Project structure

```text
.
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── App.jsx                 # Shared task state, routing, and page composition
    ├── App.css
    ├── index.css
    ├── main.jsx
    ├── api/
    │   └── taskApi.js          # In-memory mock API
    ├── components/             # Board, calendar, task forms, settings, and help UI
    ├── data/
    │   └── tasks.json          # Mock API seed tasks
    ├── tests/                  # App, API, and storage tests
    └── utils/                  # Task dates, persistence, profile, and preferences
```

## Run locally

Use Node.js with npm, then install dependencies and start Vite:

```sh
npm ci
npm run dev
```

Vite prints the local URL when the development server is ready.

## Tests, lint, and build

```sh
npm test
npm run lint
npm run build
```

`npm run test:watch` runs Vitest in watch mode. `npm run preview` serves a production build locally after `npm run build`.

## Mock API

`src/api/taskApi.js` provides `getTasks`, `createTask`, `updateTask`, and `deleteTask`. Requests wait 600 ms and then have an approximately 10% simulated failure rate. The API starts with `src/data/tasks.json`, keeps its data in module memory, generates UUIDs for created tasks, and rejects updates or deletes for IDs it does not know. Tests stub randomness and timers where needed so they do not depend on simulated failures.

**Current integration limitation:** the application does not call `getTasks` during startup. Instead it synchronously restores task columns from `localStorage`, or uses the inline fallback tasks in `src/App.jsx` when there is no saved board. Consequently, the initial API response, initial loading skeleton, and initial-load retry state are not currently part of the application flow. The API's seed data is separate from the inline fallback data.

The mock API is not a backend: its in-memory records reset when the page is reloaded and are not hydrated from the saved board. As a result, persisted tasks and mock API records can diverge, particularly for tasks created in an earlier session. The board remains usable from its local state, but an API operation for an ID absent from the current mock API data can fail.

## Task state and synchronization

`App.jsx` owns the task columns. The Board, My Tasks, and Calendar sections receive or derive their displayed task data from that shared state rather than keeping independent task stores. Search, filters, and per-page sorting affect what is displayed, not the underlying task list.

Task columns are saved under the `taskflow-team-board.columns` localStorage key. On startup, saved data is parsed and normalized against the expected columns and task fields; invalid saved data falls back to the built-in board. Changes are persisted as the shared state changes. A `storage` event listener applies valid updates from other tabs, and identical writes are skipped to avoid unnecessary storage events.

Task movement updates the board optimistically. The app serializes moves for an individual task and tracks pending operations so stale responses do not replace newer local changes. If a move request fails, the task is restored when the failed operation is still applicable and an error is shown. CRUD operations use the mock API before applying their successful results to shared state; failed requests leave the local task list unchanged and expose a retry action where supported.

## Technical decisions

- **Shared React state:** one task-column state in `App.jsx` keeps the three views consistent without adding a separate state library.
- **Local persistence:** `localStorage` supports reloads and same-origin tab synchronization without requiring a backend.
- **In-memory mock service:** a small local module provides predictable API-shaped methods and simulated latency/failures without extra dependencies.
- **URL-backed filters:** users can bookmark or share the current search/filter selection.
- **Native drag-and-drop plus keyboard controls:** task movement works without adding a task-board dependency and includes a non-pointer path.

## Known limitations

- Initial task loading is local and synchronous rather than fetched from `getTasks`; there is no initial loading skeleton or API retry flow.
- The mock API and persisted board are separate data stores. The API does not survive reloads or synchronize between tabs.
- `localStorage` synchronization is limited to tabs on the same origin and browser profile; it is not multi-user or server synchronization.
- The project has no backend, authentication, or conflict resolution between different users.
- Responsive layouts were checked at common viewport widths, but this is not a substitute for testing on a wide range of devices and browsers. Automated tests do not provide a complete assistive-technology or WCAG audit.

## Possible improvements

- Make the initial board load through the mock API with explicit loading, failure, and retry states while preserving persisted edits.
- Keep API records and persisted task state in a single source of truth, or replace the mock with a backend.
- Add browser-level end-to-end coverage for drag-and-drop, cross-tab behavior, and responsive layouts.
- Run formal accessibility checks with screen readers and automated contrast tooling across every page and theme.

## AI assistance

GitHub Copilot was used to assist with implementation, debugging, test work, and documentation. AI-generated suggestions were reviewed and validated against the repository; final project decisions remain the responsibility of the project author.
