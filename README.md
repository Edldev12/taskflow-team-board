# TaskFlow Team Board

TaskFlow is a responsive task-management application built with React and Vite. It helps users organize work through a Kanban board, personal task list, and calendar.

The application supports task creation, editing, deletion, drag-and-drop movement, keyboard-accessible interactions, search and filtering, theme preferences, and persistent browser storage.

## Features

### Task Management
- Organize tasks into **To Do**, **In Progress**, and **Done** columns.
- Create, edit, and delete tasks.
- Set task titles, descriptions, labels, priorities, and due dates.
- Move tasks between columns and reorder tasks within columns.
- Display task counts for each board column.

### Search and Filtering
- Search tasks by title and relevant task information.
- Filter tasks by status, priority, and label.
- Keep search and filter selections synchronized with URL query parameters.
- Restore filter selections when navigating between sections or refreshing the page.

### Views
- **Board:** Organize tasks using a Kanban layout.
- **My Tasks:** View and filter personal task information.
- **Calendar:** View tasks according to their due dates.

### Accessibility
- Support keyboard-based task movement.
- Provide visible keyboard focus indicators.
- Include accessible labels and form validation messages.
- Announce task movement through live regions for assistive technologies.
- Support reduced-motion preferences.
- Provide keyboard instructions and shortcuts.

### Preferences and Persistence
- Support light, dark, and system theme preferences.
- Support system-based and manually selected reduced-motion preferences.
- Save task data and preferences in browser `localStorage`.
- Synchronize task changes across open tabs using browser storage events.

### API Simulation
- Simulate API request delays.
- Simulate occasional request failures.
- Display error messages and retry options where supported.
- Handle task movement optimistically and restore the previous position when a move request fails.

## Technologies

| Technology | Purpose |
|---|---|
| React 19 | User interface and component architecture |
| JavaScript | Application logic |
| Vite | Development server and production build |
| CSS | Styling, responsive layouts, and themes |
| lucide-react | Icons |
| Vitest | Automated testing |
| jsdom | Browser-like test environment |
| React Testing Library | Component testing |
| user-event | User interaction testing |
| ESLint | Code quality and linting |

## Project Structure

```text
taskflow-team-board/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── public/
└── src/
    ├── App.jsx
    ├── App.css
    ├── index.css
    ├── main.jsx
    ├── api/
    │   └── taskApi.js
    ├── components/
    │   ├── Board and task components
    │   ├── Calendar components
    │   ├── Settings components
    │   └── Help and progress components
    ├── data/
    │   └── tasks.json
    ├── tests/
    │   ├── App.test.jsx
    │   ├── taskApi.test.js
    │   ├── taskPersistence.integration.test.jsx
    │   └── taskStorage.test.js
    └── utils/
        ├── Task date utilities
        ├── Task storage utilities
        └── Application preference utilities
```

## Installation and Setup

### Requirements

- Node.js
- npm
- Git

### Clone the repository

```bash
git clone https://github.com/Edldev12/taskflow-team-board.git
cd taskflow-team-board
```

### Install dependencies

```bash
npm ci
```

### Start the development server

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm test` | Run automated tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run build` | Generate the production build |
| `npm run preview` | Preview the production build |

## Automated Testing

The project uses Vitest and React Testing Library.

The test suite covers:

- Task creation and editing.
- Task deletion.
- Task movement and reordering.
- Search and filtering.
- Optimistic task movement and rollback after failures.
- Task storage and persistence.
- Cross-tab synchronization.
- Keyboard interactions.
- Theme and preference behavior.
- API error handling and retry behavior.

### Verified Test Results

- **4 test files passed**
- **59 tests passed**
- **0 test failures**

Run the tests using:

```bash
npm test
```

## Mock API

The mock API is implemented in:

```text
src/api/taskApi.js
```

It provides the following operations:

- `getTasks()`
- `createTask()`
- `updateTask()`
- `deleteTask()`

The simulated API includes:

- Approximately 600 milliseconds of request delay.
- An approximately 10% simulated failure rate.
- Task creation, updates, and deletion.
- Error handling for unsuccessful requests.

The mock API is not a real backend. It is designed to simulate network requests and API behavior during development and testing.

## Task State and Persistence

The application maintains shared task-column state in `App.jsx`.

The Board, My Tasks, and Calendar sections use the shared task data to keep their views consistent.

Task columns are stored using the following browser storage key:

```text
taskflow-team-board.columns
```

The application restores saved task columns from `localStorage` when it starts.

The task API also reads and persists task changes using the shared task storage, helping API operations remain consistent with saved board data across page reloads.

A browser `storage` event listener synchronizes task changes between open tabs on the same origin.

### Current Integration Limitation

The application restores its initial board synchronously from local storage or fallback task data instead of calling `getTasks()` during startup.

As a result, the initial board does not currently use an API-based loading skeleton, initial API error state, or initial-load retry flow.

The mock API and local storage do not provide real server-side synchronization, authentication, or multi-user collaboration.

## Technical Decisions

### Shared React State

A shared task-column state keeps the Board, My Tasks, and Calendar views consistent without requiring an additional state-management library.

### Local Storage

Browser storage provides task persistence after refreshing the page and synchronization between tabs on the same origin.

### Mock API

A small simulated API provides request delays and failures without requiring an external backend.

### URL-Based Filters

Search and filter values are reflected in URL query parameters, making the current filter state easier to restore and share.

### Accessible Task Movement

Native drag-and-drop is supported alongside keyboard-based movement so users are not required to use a mouse.

### Responsive Design

CSS media queries adapt the interface for different screen sizes, including mobile and desktop layouts.

## Performance and Quality Verification

The production build was tested using Chrome Lighthouse 13.5.0.

### Mobile Lighthouse Results

| Category | Score |
|---|---:|
| Performance | 99 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 82 |

### Desktop Lighthouse Results

| Category | Score |
|---|---:|
| Performance | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 82 |

### Production Build

The production build was successfully generated using:

```bash
npm run build
```

Verified build output:

- JavaScript: approximately 323.93 kB (96.40 kB gzipped).
- CSS: approximately 64.63 kB (10.73 kB gzipped).
- HTML: approximately 1.46 kB (0.65 kB gzipped).

These Lighthouse results are measurements from the tested local production preview. Results may vary depending on browser, device, and network conditions.

## Known Limitations and Future Improvements

- Add an initial API-driven loading state with a loading skeleton and retry behavior.
- Consider integrating a real backend and database.
- Add authentication and multi-user collaboration.
- Improve server-side synchronization and conflict handling.
- Add end-to-end browser tests for critical user workflows.
- Perform additional manual testing with screen readers and assistive technologies.
- Investigate the remaining Lighthouse SEO opportunities.

## AI and Contributor Disclosure

AI assistance was used during development for implementation guidance, debugging, code review, testing support, and documentation.

A teammate also contributed to the project through the API-related implementation merged in pull request #25.

The project author is responsible for understanding, reviewing, testing, and explaining the submitted application. Contributions from other people and AI assistance should be described accurately when presenting or submitting the project.

## Author

**Edlawit Tsegaye**

- GitHub: [Edldev12](https://github.com/Edldev12)
- Repository: [TaskFlow Team Board](https://github.com/Edldev12/taskflow-team-board)

---

Built with React, JavaScript, and Vite.