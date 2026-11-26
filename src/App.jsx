
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import CalendarPage from "./components/CalendarPage";
import Header from "./components/Header";
import HelpCenter from "./components/HelpCenter";
import MyTasksPage from "./components/MyTasksPage";
import SettingsPage from "./components/SettingsPage";
import TaskColumn from "./components/TaskColumn";
import YourProgressPage from "./components/YourProgressPage";
import "./App.css";
import TaskModal from "./components/TaskModal";
import {
  loadApplicationPreferences,
  saveApplicationPreferences,
} from "./utils/applicationPreferencesStorage";
import { loadProfile, saveProfile } from "./utils/profileStorage";
import {
  assignMissingDueDates,
  getStatusBasedDueDate,
  isValidDueDate,
} from "./utils/taskDates";
import {
  createTask,
  deleteTask as deleteTaskApi,
  getTasks,
  hydrateTasks,
  updateTask,
} from "./api/taskApi";
import {
  loadTasks,
  saveTasks,
  subscribeToTaskChanges,
} from "./utils/taskStorage";

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

const NOTIFICATIONS_STORAGE_KEY = "taskflow-team-board.notifications";
const THEME_PREFERENCE_STORAGE_KEY =
  document.documentElement.dataset.themeStorageKey ||
  "taskflow-team-board.theme";

function loadNotifications() {
  try {
    const savedNotifications = window.localStorage.getItem(
      NOTIFICATIONS_STORAGE_KEY
    );

    if (savedNotifications === null) return [];

    const parsedNotifications = JSON.parse(savedNotifications);

    if (
      !Array.isArray(parsedNotifications) ||
      parsedNotifications.some(
        (notification) =>
          !notification ||
          typeof notification.id !== "string" ||
          typeof notification.message !== "string" ||
          typeof notification.createdAt !== "string" ||
          !Number.isFinite(Date.parse(notification.createdAt)) ||
          typeof notification.read !== "boolean"
      )
    ) {
      throw new Error("Saved notifications are invalid.");
    }

    return parsedNotifications.slice(0, 20);
  } catch (error) {
    console.error("Unable to restore saved notifications.", error);
    return [];
  }
}

function loadThemePreference() {
  const bootPreference = document.documentElement.dataset.themePreference;

  if (
    bootPreference === "light" ||
    bootPreference === "dark" ||
    bootPreference === "system"
  ) {
    return bootPreference;
  }

  try {
    const preference = window.localStorage.getItem(
      THEME_PREFERENCE_STORAGE_KEY
    );

    return preference === "light" || preference === "dark"
      ? preference
      : "system";
  } catch (error) {
    console.error("Unable to restore the saved theme preference.", error);
    return "system";
  }
}

function getSystemTheme() {
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function normalizeTaskColumns(savedColumns) {
  if (!Array.isArray(savedColumns)) {
    throw new Error("Saved task columns are not a list.");
  }

  const restoredColumns = taskColumns.map((column) => {
    const savedColumn = savedColumns.find(
      (item) => item?.id === column.id
    );

    if (!savedColumn || !Array.isArray(savedColumn.tasks)) {
      throw new Error(`Saved tasks for "${column.id}" are invalid.`);
    }

    return {
      ...column,
      tasks: savedColumn.tasks.map((task) => {
        if (
          !task ||
          (typeof task.id !== "string" && typeof task.id !== "number") ||
          typeof task.title !== "string" ||
          typeof task.label !== "string" ||
          typeof task.priority !== "string" ||
          (task.dueDate != null &&
            task.dueDate !== "" &&
            !isValidDueDate(task.dueDate))
        ) {
          throw new Error(`A saved task in "${column.id}" is invalid.`);
        }

        return {
          ...task,
          dueDate: task.dueDate ?? "",
          status: column.id,
        };
      }),
    };
  });

  const taskIds = new Set();

  for (const column of restoredColumns) {
    for (const task of column.tasks) {
      const taskId = String(task.id);

      if (taskIds.has(taskId)) {
        throw new Error(`Saved task ID "${taskId}" appears more than once.`);
      }

      taskIds.add(taskId);
    }
  }

  return assignMissingDueDates(restoredColumns);
}

function loadTaskColumns() {
  try {
    const savedColumns = loadTasks();

    if (savedColumns === null) {
      return assignMissingDueDates(taskColumns);
    }

    return normalizeTaskColumns(savedColumns);
  } catch (error) {
    console.error("Unable to restore the saved task board.", error);
    return assignMissingDueDates(taskColumns);
  }
}

function moveTaskToPosition(
  previousColumns,
  taskId,
  destinationColumnId,
  insertionIndex
) {
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
    const position = Math.max(
      0,
      Math.min(insertionIndex, sourceTasks.length)
    );

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

  const position = Math.max(
    0,
    Math.min(insertionIndex, destinationTasks.length)
  );

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

function getTaskMovementAnnouncement(previousColumns, nextColumns, taskId) {
  const sourceColumn = previousColumns.find((column) =>
    column.tasks.some((task) => String(task.id) === String(taskId))
  );

  const destinationColumn = nextColumns.find((column) =>
    column.tasks.some((task) => String(task.id) === String(taskId))
  );

  if (!sourceColumn || !destinationColumn) return "";

  const task = sourceColumn.tasks.find(
    (item) => String(item.id) === String(taskId)
  );

  if (sourceColumn.id !== destinationColumn.id) {
    return `${task.title} moved from ${sourceColumn.title} to ${destinationColumn.title}.`;
  }

  const previousPosition = sourceColumn.tasks.findIndex(
    (item) => String(item.id) === String(taskId)
  );

  const newPosition = destinationColumn.tasks.findIndex(
    (item) => String(item.id) === String(taskId)
  );

  if (previousPosition === newPosition) return "";

  return `${task.title} moved to position ${newPosition + 1} in ${destinationColumn.title}.`;
}

function App() {
  const [themePreference, setThemePreference] = useState(loadThemePreference);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  const theme = themePreference === "system" ? systemTheme : themePreference;

  const [profile, setProfile] = useState(loadProfile);

  const [applicationPreferences, setApplicationPreferences] = useState(
    loadApplicationPreferences
  );

  const [activePage, setActivePage] = useState("dashboard");
  const [columns, setColumns] = useState(loadTaskColumns);
  const [initialSavedColumns] = useState(loadTasks);

  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  const [defaultTaskDueDate, setDefaultTaskDueDate] = useState("");
  const [notifications, setNotifications] = useState(loadNotifications);

  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [taskLoadError, setTaskLoadError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dropTargetColumnId, setDropTargetColumnId] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const [keyboardMove, setKeyboardMove] = useState(null);
  const [taskAnnouncement, setTaskAnnouncement] = useState("");

  const triggerRef = useRef(null);
  const returnFocusRef = useRef(null);
  const taskCardRefs = useRef(new Map());
  const pendingKeyboardFocusTaskId = useRef(null);
  const lastTaskAnnouncementRef = useRef(null);

  const skipNextSaveRef = useRef(false);
  const loadRequestRef = useRef(0);

  const [selectedTask, setSelectedTask] = useState(null);

  const taskStats = useMemo(() => {
    const counts = columns.reduce(
      (stats, column) => {
        const columnTaskCount = column.tasks.length;
        stats.total += columnTaskCount;

        if (column.id === "done") {
          stats.completed += columnTaskCount;
        }

        return stats;
      },
      { total: 0, completed: 0 }
    );

    return {
      ...counts,
      pending: counts.total - counts.completed,
      completionPercentage:
        counts.total === 0
          ? 0
          : Math.round((counts.completed / counts.total) * 100),
    };
  }, [columns]);

  const loadBoardTasks = useCallback(async () => {
    const requestId = ++loadRequestRef.current;

    setIsTasksLoading(true);
    setTaskLoadError("");

    try {
      const columnsToHydrate =
        initialSavedColumns !== null
          ? normalizeTaskColumns(initialSavedColumns)
          : assignMissingDueDates(taskColumns);

      hydrateTasks(
        columnsToHydrate.flatMap((column) => column.tasks)
      );

      const apiTasks = await getTasks();

      if (requestId !== loadRequestRef.current) return;

      const updatedColumns = taskColumns.map((column) => ({
        ...column,
        tasks: apiTasks
          .filter((task) => task.status === column.id)
          .map((task) => ({
            ...task,
            dueDate: task.dueDate ?? "",
          })),
      }));

      setColumns(assignMissingDueDates(updatedColumns));
      setTaskLoadError("");
    } catch (error) {
      if (requestId !== loadRequestRef.current) return;

      console.error("Unable to load tasks from the mock API.", error);

      setTaskLoadError(
        error.message || "Unable to load tasks. Please try again."
      );
    } finally {
      if (requestId === loadRequestRef.current) {
        setIsTasksLoading(false);
      }
    }
  }, [initialSavedColumns]);

  useLayoutEffect(() => {
    const rootElement = document.documentElement;

    rootElement.dataset.theme = theme;
    rootElement.dataset.themePreference = themePreference;

    return () => {
      delete rootElement.dataset.theme;
      delete rootElement.dataset.themePreference;
    };
  }, [theme, themePreference]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadBoardTasks();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      loadRequestRef.current += 1;
    };
  }, [loadBoardTasks]);

  useEffect(() => {
    if (isTasksLoading) return undefined;

    const unsubscribe = subscribeToTaskChanges((updatedColumns) => {
      try {
        const normalizedColumns = normalizeTaskColumns(updatedColumns);

        skipNextSaveRef.current = true;

        hydrateTasks(
          normalizedColumns.flatMap((column) => column.tasks)
        );

        setColumns(normalizedColumns);
      } catch (error) {
        console.error("Unable to apply synchronized task changes.", error);
      }
    });

    return unsubscribe;
  }, [isTasksLoading]);

  useEffect(() => {
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    saveTasks(columns);
  }, [columns]);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

    if (!mediaQuery) return undefined;

    const handleSystemThemeChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleSystemThemeChange);

      return () =>
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }

    mediaQuery.addListener(handleSystemThemeChange);

    return () => mediaQuery.removeListener(handleSystemThemeChange);
  }, []);

  useEffect(() => {
    try {
      if (themePreference === "system") {
        window.localStorage.removeItem(THEME_PREFERENCE_STORAGE_KEY);
      } else {
        window.localStorage.setItem(
          THEME_PREFERENCE_STORAGE_KEY,
          themePreference
        );
      }
    } catch (error) {
      console.error("Unable to save the theme preference.", error);
    }
  }, [themePreference]);

  useEffect(() => {
    const rootElement = document.documentElement;

    if (applicationPreferences.motionPreference === "reduced") {
      rootElement.setAttribute("data-app-motion", "reduced");
    } else {
      rootElement.removeAttribute("data-app-motion");
    }

    return () => rootElement.removeAttribute("data-app-motion");
  }, [applicationPreferences.motionPreference]);

  useEffect(() => {
    if (!taskAnnouncement) return undefined;

    const timeoutId = window.setTimeout(() => {
      setTaskAnnouncement("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [taskAnnouncement]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Unable to save notifications.", error);
    }
  }, [notifications]);

  useEffect(() => {
    if (pendingKeyboardFocusTaskId.current === null) return;

    const taskId = String(pendingKeyboardFocusTaskId.current);
    pendingKeyboardFocusTaskId.current = null;

    taskCardRefs.current.get(taskId)?.focus();
  }, [columns]);

  function toggleTheme(selectedTheme) {
    setThemePreference(selectedTheme);
  }

  function handleSaveProfile(nextProfile) {
    if (!saveProfile(nextProfile)) return false;

    setProfile(nextProfile);
    return true;
  }

  function handleApplicationPreferencesChange(nextPreferences) {
    if (!saveApplicationPreferences(nextPreferences)) return false;

    setApplicationPreferences(nextPreferences);
    return true;
  }

  function addNotification(message) {
    setNotifications((previousNotifications) =>
      [
        {
          id: crypto.randomUUID(),
          message,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...previousNotifications,
      ].slice(0, 20)
    );
  }

  function markNotificationsRead() {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification.read
          ? notification
          : { ...notification, read: true }
      )
    );
  }

  function recordTaskStatusChange(previousColumns, nextColumns, taskId) {
    const previousColumn = previousColumns.find((column) =>
      column.tasks.some((task) => String(task.id) === String(taskId))
    );

    const nextColumn = nextColumns.find((column) =>
      column.tasks.some((task) => String(task.id) === String(taskId))
    );

    if (
      !previousColumn ||
      !nextColumn ||
      previousColumn.id === nextColumn.id
    ) {
      return;
    }

    const task = previousColumn.tasks.find(
      (item) => String(item.id) === String(taskId)
    );

    addNotification(
      `${task.title} moved from ${previousColumn.title} to ${nextColumn.title}.`
    );
  }

  function announceTaskMovement(previousColumns, nextColumns, taskId) {
    const message = getTaskMovementAnnouncement(
      previousColumns,
      nextColumns,
      taskId
    );

    if (
      !message ||
      (message === lastTaskAnnouncementRef.current?.message &&
        String(taskId) === lastTaskAnnouncementRef.current?.taskId)
    ) {
      return;
    }

    lastTaskAnnouncementRef.current = {
      taskId: String(taskId),
      message,
    };

    setTaskAnnouncement(message);
  }

  function openCreateModal() {
    returnFocusRef.current = triggerRef.current;
    setSelectedTask(null);

    const todoTaskCount =
      columns.find((column) => column.id === "todo")?.tasks.length || 0;

    setDefaultTaskDueDate(
      getStatusBasedDueDate("todo", todoTaskCount)
    );

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
  async function saveTask(taskData) {
    const previousColumns = columns;

    if (selectedTask) {
      const sourceColumn = columns.find((column) =>
        column.tasks.some(
          (task) => String(task.id) === String(selectedTask.id)
        )
      );

      const destinationColumn = columns.find(
        (column) => column.id === taskData.status
      );

      const updatedColumns = columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          String(task.id) === String(selectedTask.id)
            ? { ...task, ...taskData }
            : task
        ),
      }));

      const nextColumns =
        sourceColumn &&
        destinationColumn &&
        sourceColumn.id !== destinationColumn.id
          ? moveTaskToPosition(
              updatedColumns,
              selectedTask.id,
              destinationColumn.id,
              destinationColumn.tasks.length
            )
          : updatedColumns;

      recordTaskStatusChange(columns, nextColumns, selectedTask.id);
      setColumns(nextColumns);
      closeModal();

      try {
        await updateTask(selectedTask.id, taskData);
        addNotification(`Task updated: ${taskData.title}.`);
      } catch (error) {
        console.error("Task update failed.", error);
        setColumns(previousColumns);
        addNotification(
          `Task update failed: ${error.message || "Please try again."}`
        );
      }

      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      ...taskData,
      dueDate:
        taskData.dueDate ||
        getStatusBasedDueDate(
          "todo",
          previousColumns.find((column) => column.id === "todo")?.tasks.length || 0
        ),
      status: "todo",
    };

    const nextColumns = previousColumns.map((column) =>
      column.id === "todo"
        ? { ...column, tasks: [...column.tasks, newTask] }
        : column
    );

    setColumns(nextColumns);
    closeModal();
    addNotification(`Task created: ${newTask.title}.`);

    try {
      await createTask(newTask);
    } catch (error) {
      console.error("Task creation failed.", error);
      setColumns(previousColumns);
      addNotification(
        `Task creation failed: ${error.message || "Please try again."}`
      );
    }
  }
 

  async function deleteTask(taskId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    const previousColumns = columns;

    const deletedTask = previousColumns
      .flatMap((column) => column.tasks)
      .find((task) => String(task.id) === String(taskId));

    if (!deletedTask) return;

    const nextColumns = previousColumns.map((column) => ({
      ...column,
      tasks: column.tasks.filter(
        (task) => String(task.id) !== String(taskId)
      ),
    }));

    setColumns(nextColumns);

    try {
      await deleteTaskApi(taskId);

      addNotification(`Task deleted: ${deletedTask.title}.`);
    } catch (error) {
      console.error("Task deletion failed.", error);

      setColumns(previousColumns);

      addNotification(
        `Task deletion failed: ${error.message || "Please try again."}`
      );
    }
  }

  async function saveTaskMovement(previousColumns, nextColumns, taskId) {
    const previousColumn = previousColumns.find((column) =>
      column.tasks.some((task) => String(task.id) === String(taskId))
    );

    const nextColumn = nextColumns.find((column) =>
      column.tasks.some((task) => String(task.id) === String(taskId))
    );

    if (!previousColumn || !nextColumn) return;

    setColumns(nextColumns);

    announceTaskMovement(previousColumns, nextColumns, taskId);
    recordTaskStatusChange(previousColumns, nextColumns, taskId);

    if (previousColumn.id === nextColumn.id) return;

    const movedTask = nextColumn.tasks.find(
      (task) => String(task.id) === String(taskId)
    );

    try {
      await updateTask(taskId, {
        status: nextColumn.id,
      });
    } catch (error) {
      console.error("Task movement failed.", error);

      setColumns(previousColumns);

      addNotification(
        `Unable to move ${movedTask.title}: ${error.message || "Please try again."}`
      );
    }
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
      position:
        event.clientY < bounds.top + bounds.height / 2
          ? "before"
          : "after",
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
        event.clientY < bounds.top + bounds.height / 2
          ? "before"
          : "after";
    }

    if (taskId) {
      const sourceColumnIndex = columns.findIndex((column) =>
        column.tasks.some((task) => String(task.id) === taskId)
      );

      const destinationColumnIndex = columns.findIndex(
        (column) => column.id === columnId
      );

      if (sourceColumnIndex !== -1 && destinationColumnIndex !== -1) {
        const destinationTasks = columns[destinationColumnIndex].tasks.filter(
          (task) =>
            sourceColumnIndex !== destinationColumnIndex ||
            String(task.id) !== taskId
        );

        const targetIndex =
          targetTaskId === null
            ? destinationTasks.length
            : destinationTasks.findIndex(
                (item) => String(item.id) === String(targetTaskId)
              );

        if (targetIndex !== -1) {
          const nextColumns = moveTaskToPosition(
            columns,
            taskId,
            columnId,
            targetIndex + (targetPosition === "after" ? 1 : 0)
          );

          if (nextColumns !== columns) {
            saveTaskMovement(columns, nextColumns, taskId);
          }
        }
      }
    }

    setDraggedTaskId(null);
    setDropTargetColumnId(null);
    setDropIndicator(null);
  }

  function handleTaskKeyDown(taskId, event) {
    if (event.target !== event.currentTarget) return;

    const activeMove =
      keyboardMove &&
      String(keyboardMove.taskId) === String(taskId);

    if (event.key === "Tab" && activeMove) {
      setKeyboardMove(null);
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
        return;
      }

      const nextColumns = moveTaskToPosition(
        columns,
        keyboardMove.taskId,
        keyboardMove.columnId,
        keyboardMove.index
      );

      if (nextColumns !== columns) {
        pendingKeyboardFocusTaskId.current = keyboardMove.taskId;

        saveTaskMovement(
          columns,
          nextColumns,
          keyboardMove.taskId
        );
      }

      setKeyboardMove(null);
      return;
    }

    if (event.key === "Escape" && activeMove) {
      event.preventDefault();
      event.stopPropagation();

      setKeyboardMove(null);
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

    if (
      destinationColumnIndex < 0 ||
      destinationColumnIndex >= columns.length
    ) {
      return;
    }

    const destinationColumn = columns[destinationColumnIndex];

    const availableSlots =
      destinationColumn.tasks.length -
      (destinationColumn.id === keyboardMove.sourceColumnId ? 1 : 0);

    if (event.key === "ArrowUp") destinationIndex -= 1;
    if (event.key === "ArrowDown") destinationIndex += 1;

    destinationIndex = Math.max(
      0,
      Math.min(destinationIndex, availableSlots)
    );

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
  }

  function handleTaskDragEnd() {
    setDraggedTaskId(null);
    setDropTargetColumnId(null);
    setDropIndicator(null);
  }

  return (
    <div
      className="app-layout"
      data-theme={theme}
      data-motion-preference={applicationPreferences.motionPreference}
      data-task-density={
        applicationPreferences.compactTaskCards ? "compact" : "comfortable"
      }
    >
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

          <a
            href="#dashboard"
            className={`nav-link${activePage === "dashboard" ? " active" : ""}`}
            aria-current={activePage === "dashboard" ? "page" : undefined}
            onClick={() => setActivePage("dashboard")}
          >
            <span className="nav-icon">▦</span>
            Dashboard
          </a>

          <a
            href="#my-tasks"
            className={`nav-link${activePage === "my-tasks" ? " active" : ""}`}
            aria-current={activePage === "my-tasks" ? "page" : undefined}
            onClick={() => setActivePage("my-tasks")}
          >
            <span className="nav-icon">☑</span>
            My Tasks
          </a>

          <a
            href="#calendar"
            className={`nav-link${activePage === "calendar" ? " active" : ""}`}
            aria-current={activePage === "calendar" ? "page" : undefined}
            onClick={() => setActivePage("calendar")}
          >
            <span className="nav-icon">▣</span>
            Calendar
          </a>

          <a
            href="#settings"
            className={`nav-link${activePage === "settings" ? " active" : ""}`}
            aria-current={activePage === "settings" ? "page" : undefined}
            onClick={() => setActivePage("settings")}
          >
            <span className="nav-icon">⚙</span>
            Settings
          </a>

          <a
            href="#help"
            className={`nav-link${activePage === "help" ? " active" : ""}`}
            aria-current={activePage === "help" ? "page" : undefined}
            onClick={() => setActivePage("help")}
          >
            <span className="nav-icon">?</span>
            Help
          </a>

          <div className="sidebar-divider"></div>

          <a
            href="#your-progress"
            className={`nav-link${activePage === "progress" ? " active" : ""}`}
            aria-current={activePage === "progress" ? "page" : undefined}
            onClick={() => setActivePage("progress")}
          >
            <span className="nav-icon">◷</span>
            Your Progress
          </a>
        </nav>


        <div className="sidebar-bottom">
          <div className="sidebar-profile">
            <div
              className="profile-avatar"
              role="img"
              aria-label={`${profile.initials} profile initials`}
            >
              {profile.initials}
            </div>

            <div className="sidebar-profile-info">
              <strong>{profile.fullName}</strong>
            </div>
          </div>
        </div>

      </aside>

      <main className="main-layout">
        <Header
          profile={profile}
          theme={theme}
          onThemeChange={toggleTheme}
          searchQuery={taskSearchQuery}
          onSearchQueryChange={setTaskSearchQuery}
          notifications={notifications}
          onNotificationsRead={markNotificationsRead}
        />

        {activePage === "help" ? (
          <HelpCenter
            onReturnToDashboard={() => setActivePage("dashboard")}
          />
        ) : activePage === "settings" ? (
          <SettingsPage
            theme={theme}
            themePreference={themePreference}
            onThemePreferenceChange={setThemePreference}
            profile={profile}
            onSaveProfile={handleSaveProfile}
            applicationPreferences={applicationPreferences}
            onApplicationPreferencesChange={
              handleApplicationPreferencesChange
            }
          />
        ) : activePage === "progress" ? (
          <YourProgressPage
            totalTasks={taskStats.total}
            completedTasks={taskStats.completed}
            pendingTasks={taskStats.pending}
            completionPercentage={taskStats.completionPercentage}
          />
        ) : activePage === "calendar" ? (
          <CalendarPage
            columns={columns}
            onEditTask={openEditModal}
            isEditModalOpen={isModalOpen}
          />
        ) : activePage === "my-tasks" ? (
          <MyTasksPage
            columns={columns}
            searchQuery={taskSearchQuery}
            onSearchQueryChange={setTaskSearchQuery}
            onCreateTask={openCreateModal}
            onEditTask={openEditModal}
            onDeleteTask={deleteTask}
            createButtonRef={triggerRef}
          />
        ) : (
          <section className="dashboard-content" id="dashboard">
            <div className="dashboard-heading">
              <div>
                <h1>My Tasks</h1>
                <p>Organize your work and stay on track.</p>
              </div>

              <button
                ref={triggerRef}
                className="add-task-button"
                onClick={openCreateModal}
                type="button"
              >
                <span>+</span> Add Task
              </button>
            </div>

            {taskLoadError && (
              <div className="task-load-error" role="alert">
                <p>{taskLoadError}</p>

                <button
                  type="button"
                  onClick={loadBoardTasks}
                  disabled={isTasksLoading}
                >
                  {isTasksLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {isTasksLoading &&
              columns.every((column) => column.tasks.length === 0) && (
                <div
                  className="task-board task-board-loading"
                  role="status"
                  aria-label="Loading tasks"
                >
                  {taskColumns.map((column) => (
                    <div
                      className="task-column task-loading-column"
                      key={column.id}
                    >
                      <div className="task-loading-header">
                        <div className="task-loading-line"></div>
                        <div className="task-loading-count"></div>
                      </div>

                      {[1, 2, 3].map((item) => (
                        <div className="task-loading-card" key={item}>
                          <div className="task-loading-line"></div>
                          <div className="task-loading-line short"></div>
                          <div className="task-loading-footer"></div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

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
                  onColumnDragOver={(event) =>
                    handleColumnDragOver(column.id, event)
                  }
                  onColumnDragLeave={(event) =>
                    handleColumnDragLeave(column.id, event)
                  }
                  onTaskDrop={(event, targetTaskId) =>
                    handleTaskDrop(column.id, event, targetTaskId)
                  }
                />
              ))}
            </div>

            <p id="task-keyboard-help" className="visually-hidden">
              Press Enter or Space on a task to pick it up. Use the arrow keys
              to choose a column and position, then press Enter or Space to
              drop. Press Escape to cancel. Tab cancels movement and continues
              navigation.
            </p>

            <div
              className={`task-movement-notification${taskAnnouncement ? " is-visible" : ""}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span
                className="task-movement-notification-icon"
                aria-hidden="true"
              >
                ✓
              </span>

              {taskAnnouncement}
            </div>
          </section>
        )}

        {isModalOpen && (
          <TaskModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onSave={saveTask}
            task={selectedTask}
            defaultDueDate={defaultTaskDueDate}
            returnFocusRef={returnFocusRef}
          />
        )}
      </main>
    </div>
  );
}

export default App;
