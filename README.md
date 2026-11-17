# taskflow-team-board
Team Task Management Board – React Front-End Intern Challenge
# TaskFlow – Team Task Management Board

## About the Project

TaskFlow is a responsive team task management application built with React and JavaScript.

It helps users organize tasks using three columns:
- To Do
- In Progress
- Done

This project is developed as part of the Front-End Intern Challenge.

## Technologies

- React
- Vite
- JavaScript
- HTML5
- CSS3
- localStorage
- Vitest
- Git and GitHub

## Team Members and Responsibilities

| Member | Responsibility |
|---|---|
| Person 1 | Dashboard UI and Responsive Design |
| Person 2 | Task CRUD Operations |
| Person 3 | Drag and Drop |
| Person 4 | Mock API and Data Management |

# Person 1:
```text
git checkout -b feature/dashboard-ui
```
# Person 2:
```text
git checkout -b feature/task-crud
```

# Person 3:
```text
git checkout -b feature/drag-drop
```

# Person 4:
```text
git checkout -b feature/api-data
```
## Main Features

- Create, edit and delete tasks
- Drag and drop tasks
- Search and filter tasks
- Task labels
- Light and dark themes
- Responsive design
- Loading and error states
- Local storage persistence
- Automated tests

## Project Structure

```text
src/
├── components/
│   ├── Header.jsx
│   ├── TaskCard.jsx
│   ├── TaskColumn.jsx
│   ├── TaskModal.jsx
│   └── SearchFilter.jsx
│
├── services/
│   └── taskApi.js
│
├── hooks/
│   └── useTasks.js
│
├── utils/
│   └── taskHelpers.js
│
├── tests/
│
├── App.jsx
├── main.jsx
└── index.css

public/
└── tasks.json
```

## Installation

Clone the repository:

```bash
git clone YOUR_REPOSITORY_URL
cd taskflow-team-board
npm install
npm run dev
```

## Git Workflow

1. Work on your assigned feature branch.
2. Never push feature work directly to main.
3. Use meaningful commit messages.
4. Push your branch to GitHub.
5. Create a Pull Request.
6. Wait for code review before merging.

## Shared Task Data Structure

```javascript
{
  id: crypto.randomUUID(),
  title: "Update pricing page",
  description: "Improve the pricing section",
  status: "todo",
  priority: "high",
  labels: ["Frontend", "Design"],
  createdAt: new Date().toISOString()
}
```

Status values:
- todo
- in-progress
- done

## Project Management

We use:
- GitHub Issues for assigned tasks.
- GitHub Projects for tracking progress.
- Pull Requests for code review.

## Contributors

Developed collaboratively by our team of four.

## License

MIT
