
import { useRef, useState } from "react";
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
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const triggerRef = useRef(null);
  const returnFocusRef = useRef(null);
  const [selectedTask, setSelectedTask] = useState(null);
  function toggleTheme(selectedTheme) {
    setTheme(selectedTheme);
  }
  function openCreateModal() {
    returnFocusRef.current = triggerRef.current;
    setSelectedTask(null);
    setIsModalOpen(true);
  }

  function openEditModal(task, triggerElement) {
    returnFocusRef.current = triggerElement;
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

  function handleTaskDragStart(taskId, event) {
    event.dataTransfer.setData("text/plain", String(taskId));
    event.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
  }

  function handleColumnDragOver(columnId, event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetColumnId(columnId);
  }

  function handleColumnDragLeave(columnId, event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDropTargetColumnId((currentColumnId) =>
        currentColumnId === columnId ? null : currentColumnId
      );
      setDropIndicator((currentIndicator) =>
        currentIndicator?.columnId === columnId ? null : currentIndicator
      );
    }
  }

  function handleTaskDragOver(columnId, targetTaskId, event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetColumnId(columnId);

    if (String(draggedTaskId) === String(targetTaskId)) {
      setDropIndicator(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    setDropIndicator({
      columnId,
      taskId: targetTaskId,
      position: event.clientY < bounds.top + bounds.height / 2 ? "before" : "after",
    });
  }

  function handleTaskDrop(columnId, event, targetTaskId = null) {
    event.preventDefault();
    event.stopPropagation();
    const taskId = event.dataTransfer.getData("text/plain");
    let targetPosition = null;

    if (targetTaskId !== null) {
      const bounds = event.currentTarget.getBoundingClientRect();
      targetPosition =
        event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    }

    if (taskId) {
      setColumns((previousColumns) => {
        const sourceColumnIndex = previousColumns.findIndex((column) =>
          column.tasks.some((task) => String(task.id) === taskId)
        );
        const destinationColumnIndex = previousColumns.findIndex(
          (column) => column.id === columnId
        );

        if (sourceColumnIndex === -1 || destinationColumnIndex === -1) {
          return previousColumns;
        }

        const sourceColumn = previousColumns[sourceColumnIndex];
        const taskIndex = sourceColumn.tasks.findIndex(
          (task) => String(task.id) === taskId
        );
        if (taskIndex === -1) return previousColumns;

        if (sourceColumnIndex === destinationColumnIndex) {
          const reorderedTasks = [...sourceColumn.tasks];
          const [task] = reorderedTasks.splice(taskIndex, 1);
          const targetIndex = targetTaskId === null
            ? reorderedTasks.length
            : reorderedTasks.findIndex(
              (item) => String(item.id) === String(targetTaskId)
            );

          if (targetIndex === -1) return previousColumns;

          const insertionIndex =
            targetIndex + (targetPosition === "after" ? 1 : 0);
          reorderedTasks.splice(insertionIndex, 0, task);

          return previousColumns.map((column, index) =>
            index === sourceColumnIndex
              ? { ...column, tasks: reorderedTasks }
              : column
          );
        }

        const task = sourceColumn.tasks[taskIndex];
        const destinationColumn = previousColumns[destinationColumnIndex];
        const destinationTasks = [...destinationColumn.tasks];
        const targetIndex = targetTaskId === null
          ? destinationTasks.length
          : destinationTasks.findIndex(
            (item) => String(item.id) === String(targetTaskId)
          );

        if (targetIndex === -1) return previousColumns;

        const insertionIndex = targetIndex + (targetPosition === "after" ? 1 : 0);
        destinationTasks.splice(insertionIndex, 0, {
          ...task,
          status: destinationColumn.id,
        });

        return previousColumns.map((column, index) => {
          if (index === sourceColumnIndex) {
            return {
              ...column,
              tasks: column.tasks.filter((item) => String(item.id) !== taskId),
            };
          }

          if (index === destinationColumnIndex) {
            return { ...column, tasks: destinationTasks };
          }

          return column;
        });
      });
    }

    setDraggedTaskId(null);
    setDropTargetColumnId(null);
    setDropIndicator(null);
  }

  function handleTaskDragEnd() {
    setDraggedTaskId(null);
    setDropTargetColumnId(null);
    setDropIndicator(null);
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
              ref={triggerRef}
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
                draggedTaskId={draggedTaskId}
                dropIndicator={dropIndicator}
                isDropTarget={dropTargetColumnId === column.id}
                onTaskDragStart={handleTaskDragStart}
                onTaskDragEnd={handleTaskDragEnd}
                onTaskDragOver={(taskId, event) =>
                  handleTaskDragOver(column.id, taskId, event)
                }
                onColumnDragOver={(event) => handleColumnDragOver(column.id, event)}
                onColumnDragLeave={(event) => handleColumnDragLeave(column.id, event)}
                onTaskDrop={(event, targetTaskId) =>
                  handleTaskDrop(column.id, event, targetTaskId)
                }
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
            returnFocusRef={returnFocusRef}
          />
        )}
      </main>
    </div>
  );
}

export default App;
