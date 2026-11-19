
import { useEffect, useRef, useState } from "react";
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
      { id: 1, title: "Design landing page", label: "Design", priority: "High", status: "todo" },
      { id: 2, title: "Review project requirements", label: "Planning", priority: "Medium", status: "todo" },
      { id: 3, title: "Create navigation layout", label: "Frontend", priority: "Low", status: "todo" },
      { id: 8, title: "Prepare project documentation", label: "Planning", priority: "Medium", status: "todo" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "orange",
    tasks: [
      { id: 4, title: "Build dashboard interface", label: "Frontend", priority: "High", status: "in-progress" },
      { id: 5, title: "Implement responsive layout", label: "Design", priority: "Medium", status: "in-progress" },
      { id: 9, title: "Develop task components", label: "Frontend", priority: "High", status: "in-progress" },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "green",
    tasks: [
      { id: 6, title: "Set up React project", label: "Development", priority: "High", status: "done" },
      { id: 7, title: "Create project structure", label: "Planning", priority: "Low", status: "done" },
      { id: 10, title: "Configure Vite", label: "Development", priority: "Medium", status: "done" },
    ],
  },
];

function moveTaskToPosition(previousColumns, taskId, destinationColumnId, insertionIndex) {
  const sourceColumnIndex = previousColumns.findIndex((column) =>
    column.tasks.some((task) => String(task.id) === String(taskId))
  );
  const destinationColumnIndex = previousColumns.findIndex(
    (column) => column.id === destinationColumnId
  );

  if (sourceColumnIndex === -1 || destinationColumnIndex === -1) {
    return previousColumns;
  }

  const sourceColumn = previousColumns[sourceColumnIndex];
  const task = sourceColumn.tasks.find(
    (item) => String(item.id) === String(taskId)
  );
  const sourceTasks = sourceColumn.tasks.filter(
    (item) => String(item.id) !== String(taskId)
  );

  if (sourceColumnIndex === destinationColumnIndex) {
    const position = Math.max(0, Math.min(insertionIndex, sourceTasks.length));
    const reorderedTasks = [...sourceTasks];
    reorderedTasks.splice(position, 0, task);

    if (
      reorderedTasks.every(
        (item, index) => item.id === sourceColumn.tasks[index].id
      )
    ) {
      return previousColumns;
    }

    return previousColumns.map((column, index) =>
      index === sourceColumnIndex
        ? { ...column, tasks: reorderedTasks }
        : column
    );
  }

  const destinationColumn = previousColumns[destinationColumnIndex];
  const destinationTasks = [...destinationColumn.tasks];
  const position = Math.max(0, Math.min(insertionIndex, destinationTasks.length));
  destinationTasks.splice(position, 0, {
    ...task,
    status: destinationColumn.id,
  });

  return previousColumns.map((column, index) => {
    if (index === sourceColumnIndex) {
      return { ...column, tasks: sourceTasks };
    }

    if (index === destinationColumnIndex) {
      return { ...column, tasks: destinationTasks };
    }

    return column;
  });
}

function App() {
  const [theme, setTheme] = useState("light");
  const [columns, setColumns] = useState(taskColumns);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [keyboardMove, setKeyboardMove] = useState(null);
  const [keyboardAnnouncement, setKeyboardAnnouncement] = useState("");
  const triggerRef = useRef(null);
  const returnFocusRef = useRef(null);
  const taskCardRefs = useRef(new Map());
  const pendingKeyboardFocusTaskId = useRef(null);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    if (pendingKeyboardFocusTaskId.current === null) return;

    const taskId = String(pendingKeyboardFocusTaskId.current);
    pendingKeyboardFocusTaskId.current = null;
    taskCardRefs.current.get(taskId)?.focus();
  }, [columns]);

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
    setKeyboardMove(null);
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

        const destinationTasks = previousColumns[destinationColumnIndex].tasks.filter(
          (task) =>
            sourceColumnIndex !== destinationColumnIndex ||
            String(task.id) !== taskId
        );
        const targetIndex = targetTaskId === null
          ? destinationTasks.length
          : destinationTasks.findIndex(
            (item) => String(item.id) === String(targetTaskId)
          );

        if (targetIndex === -1) return previousColumns;

        return moveTaskToPosition(
          previousColumns,
          taskId,
          columnId,
          targetIndex + (targetPosition === "after" ? 1 : 0)
        );
      });
    }

    setDraggedTaskId(null);
    setDropTargetColumnId(null);
    setDropIndicator(null);
  }

  function getKeyboardMoveAnnouncement(move, prefix = "Moving") {
    const column = columns.find((item) => item.id === move.columnId);
    if (!column) return "";

    const task = columns
      .flatMap((item) => item.tasks)
      .find((item) => String(item.id) === String(move.taskId));
    const totalTasks =
      column.tasks.length +
      (move.columnId === move.sourceColumnId ? 0 : 1);

    return `${prefix} ${task?.title || "task"} to ${column.title}, position ${
      move.index + 1
    } of ${totalTasks}. Use the arrow keys to choose a position, Enter or Space to drop, or Escape to cancel.`;
  }

  function handleTaskKeyDown(taskId, event) {
    if (event.target !== event.currentTarget) return;

    const activeMove =
      keyboardMove &&
      String(keyboardMove.taskId) === String(taskId);

    if (event.key === "Tab" && activeMove) {
      setKeyboardMove(null);
      setKeyboardAnnouncement("Keyboard task movement canceled.");
      return;
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      (!keyboardMove || activeMove)
    ) {
      event.preventDefault();
      event.stopPropagation();

      if (!keyboardMove) {
        const sourceColumnIndex = columns.findIndex((column) =>
          column.tasks.some((task) => String(task.id) === String(taskId))
        );
        if (sourceColumnIndex === -1) return;

        const sourceColumn = columns[sourceColumnIndex];
        const sourceIndex = sourceColumn.tasks.findIndex(
          (task) => String(task.id) === String(taskId)
        );
        const move = {
          taskId,
          sourceColumnId: sourceColumn.id,
          columnId: sourceColumn.id,
          index: sourceIndex,
        };
        setKeyboardMove(move);
        setKeyboardAnnouncement(
          getKeyboardMoveAnnouncement(move, "Picked up")
        );
        return;
      }

      pendingKeyboardFocusTaskId.current = keyboardMove.taskId;
      setColumns((previousColumns) =>
        moveTaskToPosition(
          previousColumns,
          keyboardMove.taskId,
          keyboardMove.columnId,
          keyboardMove.index
        )
      );
      setKeyboardAnnouncement(
        getKeyboardMoveAnnouncement(keyboardMove, "Moved")
      );
      setKeyboardMove(null);
      return;
    }

    if (event.key === "Escape" && activeMove) {
      event.preventDefault();
      event.stopPropagation();
      setKeyboardMove(null);
      setKeyboardAnnouncement("Keyboard task movement canceled.");
      return;
    }

    if (!activeMove) return;

    if (
      event.key !== "ArrowUp" &&
      event.key !== "ArrowDown" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight"
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const currentColumnIndex = columns.findIndex(
      (column) => column.id === keyboardMove.columnId
    );
    let destinationColumnIndex = currentColumnIndex;
    let destinationIndex = keyboardMove.index;

    if (event.key === "ArrowLeft") destinationColumnIndex -= 1;
    if (event.key === "ArrowRight") destinationColumnIndex += 1;

    if (destinationColumnIndex < 0 || destinationColumnIndex >= columns.length) {
      return;
    }

    const destinationColumn = columns[destinationColumnIndex];
    const availableSlots =
      destinationColumn.tasks.length -
      (destinationColumn.id === keyboardMove.sourceColumnId ? 1 : 0);

    if (event.key === "ArrowUp") destinationIndex -= 1;
    if (event.key === "ArrowDown") destinationIndex += 1;
    destinationIndex = Math.max(0, Math.min(destinationIndex, availableSlots));

    if (
      destinationColumn.id === keyboardMove.columnId &&
      destinationIndex === keyboardMove.index
    ) {
      return;
    }

    const move = {
      ...keyboardMove,
      columnId: destinationColumn.id,
      index: destinationIndex,
    };
    setKeyboardMove(move);
    setKeyboardAnnouncement(getKeyboardMoveAnnouncement(move));
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
                keyboardMove={keyboardMove}
                isDropTarget={
                  dropTargetColumnId === column.id ||
                  keyboardMove?.columnId === column.id
                }
                onTaskDragStart={handleTaskDragStart}
                onTaskDragEnd={handleTaskDragEnd}
                onTaskDragOver={(taskId, event) =>
                  handleTaskDragOver(column.id, taskId, event)
                }
                onTaskKeyDown={handleTaskKeyDown}
                onTaskCardRef={(taskId, element) => {
                  const key = String(taskId);
                  if (element) {
                    taskCardRefs.current.set(key, element);
                  } else {
                    taskCardRefs.current.delete(key);
                  }
                }}
                onColumnDragOver={(event) => handleColumnDragOver(column.id, event)}
                onColumnDragLeave={(event) => handleColumnDragLeave(column.id, event)}
                onTaskDrop={(event, targetTaskId) =>
                  handleTaskDrop(column.id, event, targetTaskId)
                }
              />
            ))}
          </div>
          <p id="task-keyboard-help" className="visually-hidden">
            Press Enter or Space on a task to pick it up. Use the arrow keys to
            choose a column and position, then press Enter or Space to drop.
            Press Escape to cancel. Tab cancels movement and continues navigation.
          </p>
          <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
            {keyboardAnnouncement}
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
