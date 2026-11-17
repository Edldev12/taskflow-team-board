
import Header from "./components/Header";
import TaskColumn from "./components/TaskColumn";
import "./App.css";

const taskColumns = [
  {
    id: "todo",
    title: "To Do",
    color: "blue",
    tasks: [
      { id: 1, title: "Design landing page", label: "Design", priority: "High" },
      { id: 2, title: "Review project requirements", label: "Planning", priority: "Medium" },
      { id: 3, title: "Create navigation layout", label: "Frontend", priority: "Low" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "orange",
    tasks: [
      { id: 4, title: "Build dashboard interface", label: "Frontend", priority: "High" },
      { id: 5, title: "Implement responsive layout", label: "Design", priority: "Medium" },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "green",
    tasks: [
      { id: 6, title: "Set up React project", label: "Development", priority: "High" },
      { id: 7, title: "Create project structure", label: "Planning", priority: "Low" },
    ],
  },
];

function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">T</div>
          <h2>TaskFlow</h2>
        </div>

        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-link active">
            <span>▦</span> Dashboard
          </a>
          <a href="#your-progress" className="nav-link">
            <span>◷</span> Your Progress
          </a>
          <a href="#settings" className="nav-link">
            <span>⚙</span> Settings
          </a>
        </nav>
      </aside>

      <main className="main-layout">
        <Header />

        <section className="dashboard-content" id="dashboard">
          <div className="dashboard-heading">
            <div>
              <h1>My Tasks</h1>
              <p>Organize your work and stay on track.</p>
            </div>

            <button className="add-task-button" disabled>
              + Add Task
            </button>
          </div>

          <div className="task-board">
            {taskColumns.map((column) => (
              <TaskColumn key={column.id} column={column} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
