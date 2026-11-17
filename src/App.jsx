import Header from "./components/Header";
import "./App.css";

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

          <div className="board-placeholder">
            Your task board will appear here.
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;