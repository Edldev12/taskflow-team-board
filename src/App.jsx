
import { useState } from "react";
import Header from "./components/Header";
import TaskColumn from "./components/TaskColumn";
import "./App.css";
import TaskModal from "./components/TaskModal";

const taskColumns = [
  {
    id: "todo",
    title: "To Do",
    color: "blue",
    tasks: [
      { id: 1, title: "Design landing page", label: "Design", priority: "High" },
      { id: 2, title: "Review project requirements", label: "Planning", priority: "Medium" },
      { id: 3, title: "Create navigation layout", label: "Frontend", priority: "Low" },
      { id: 8, title: "Prepare project documentation", label: "Planning", priority: "Medium" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "orange",
    tasks: [
      { id: 4, title: "Build dashboard interface", label: "Frontend", priority: "High" },
      { id: 5, title: "Implement responsive layout", label: "Design", priority: "Medium" },
      { id: 9, title: "Develop task components", label: "Frontend", priority: "High" },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "green",
    tasks: [
      { id: 6, title: "Set up React project", label: "Development", priority: "High" },
      { id: 7, title: "Create project structure", label: "Planning", priority: "Low" },
      { id: 10, title: "Configure Vite", label: "Development", priority: "Medium" },
    ],
  },
];

function App() {
  const [theme, setTheme] = useState("light");
  const [columns, setColumns] = useState(taskColumns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  function toggleTheme(selectedTheme) {
    setTheme(selectedTheme);
  }
  function openCreateModal() {
    setSelectedTask(null);
    setIsModalOpen(true);
  }

  function openEditModal(task) {
    setSelectedTask(task);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedTask(null);
  }

  function saveTask(taskData) {
    if (selectedTask) {
      // Update existing task
      setColumns((previousColumns) =>
        previousColumns.map((column) => ({
          ...column,
          tasks: column.tasks.map((task) =>
            task.id === selectedTask.id
              ? { ...task, ...taskData }
              : task
          ),
        }))
      );
    } else {
      // Create new task in To Do
      const newTask = {
        id: crypto.randomUUID(),
        ...taskData,
        status: "todo",
      };

      setColumns((previousColumns) =>
        previousColumns.map((column) =>
          column.id === "todo"
            ? { ...column, tasks: [...column.tasks, newTask] }
            : column
        )
      );
    }

    closeModal();
  }

  function deleteTask(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    setColumns((previousColumns) =>
      previousColumns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => task.id !== taskId),
      }))
    );
  }
  return (
    <div className="app-layout" data-theme={theme}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✓</div>
          <div>
            <h2>TaskFlow</h2>
            <p>Plan Smart. Work Better.</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">WORKSPACE</span>

          <a href="#dashboard" className="nav-link active">
            <span className="nav-icon">▦</span>
            Dashboard
          </a>

          <a href="#my-tasks" className="nav-link">
            <span className="nav-icon">☑</span>
            My Tasks
          </a>

          <a href="#calendar" className="nav-link">
            <span className="nav-icon">▣</span>
            Calendar
          </a>

          <a href="#settings" className="nav-link">
            <span className="nav-icon">⚙</span>
            Settings
          </a>

          <a href="#help" className="nav-link">
            <span className="nav-icon">?</span>
            Help
          </a>

          <div className="sidebar-divider"></div>

          <a href="#your-progress" className="nav-link">
            <span className="nav-icon">◷</span>
            Your Progress
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="theme-switch">
            <button
              className={theme === "light" ? "theme-option selected" : "theme-option"}
              onClick={() => toggleTheme("light")}
              aria-pressed={theme === "light"}
            >
              ☀ Light
            </button>

            <button
              className={theme === "dark" ? "theme-option selected" : "theme-option"}
              onClick={() => toggleTheme("dark")}
              aria-pressed={theme === "dark"}
            >
              ☾ Dark
            </button>
          </div>

          <div className="sidebar-profile">
            <div className="profile-avatar">WK</div>
            <div className="sidebar-profile-info">
              <strong>Weynshet</strong>
              <span>Team Member</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-layout">
        <Header />

        <section className="dashboard-content" id="dashboard">
          <div className="dashboard-heading">
            <div>
              <h1>My Tasks</h1>
              <p>Organize your work and stay on track.</p>
            </div>

            {/*
            <button className="add-task-button" disabled>
              <span>+</span> Add Task
            </button>
            */}
            <button
              className="add-task-button"
              onClick={openCreateModal}
              type="button"
            >
              <span>+</span> Add Task
            </button>
          </div>

          {/*
          <div className="task-board">
            {taskColumns.map((column) => (
              <TaskColumn key={column.id} column={column} />
            ))}
          </div>
          */}
          <div className="task-board">
            {columns.map((column) => (
              <TaskColumn
                key={column.id}
                column={column}
                onEdit={openEditModal}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </section>
        {isModalOpen && (
          <TaskModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onSave={saveTask}
            task={selectedTask}
          />
        )}
      </main>
    </div>
  );
}

export default App;
