
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  updateTask as updateTaskRequest,
} from "./api/taskApi";
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
  TASK_STORAGE_KEY,
  loadTasks,
  saveTasks,
  subscribeToTaskChanges,
} from "./utils/taskStorage";
import {
  assignMissingDueDates,
  getStatusBasedDueDate,
  isValidDueDate,
} from "./utils/taskDates";

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
    const preference = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
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

function normalizeTaskColumns(parsedColumns) {
  if (!Array.isArray(parsedColumns)) {
    throw new Error("Saved task columns are not a list.");
  }

  const restoredColumns = taskColumns.map((column) => {
    const savedColumn = parsedColumns.find((item) => item?.id === column.id);

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
  const savedColumns = loadTasks();
  if (savedColumns === null) {
    return assignMissingDueDates(taskColumns);
  }

  try {
    return normalizeTaskColumns(savedColumns);
  } catch (error) {
    console.error("Unable to restore the saved task board.", error);
    return assignMissingDueDates(taskColumns);
  }
}

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

  const task = previousColumns[sourceColumnIndex].tasks.find(
    (item) => String(item.id) === String(taskId)
  );
  const taskIdString = String(taskId);
  const nextTaskLists = previousColumns.map((column) =>
    column.tasks.filter((item) => String(item.id) !== taskIdString)
  );
  const destinationColumn = previousColumns[destinationColumnIndex];
  const destinationTasks = nextTaskLists[destinationColumnIndex];
  const requestedPosition = Number.isFinite(insertionIndex)
    ? Math.trunc(insertionIndex)
    : destinationTasks.length;
  const position = Math.max(0, Math.min(requestedPosition, destinationTasks.length));
  const movedTask =
    sourceColumnIndex === destinationColumnIndex
      ? task
      : { ...task, status: destinationColumn.id };
  destinationTasks.splice(position, 0, movedTask);

  const isUnchanged = previousColumns.every((column, columnIndex) => {
    const nextTasks = nextTaskLists[columnIndex];
    return (
      column.tasks.length === nextTasks.length &&
      column.tasks.every((item, index) => item === nextTasks[index])
    );
  });
  if (isUnchanged) return previousColumns;

  return previousColumns.map((column, columnIndex) => {
    const nextTasks = nextTaskLists[columnIndex];
    const tasksUnchanged =
      column.tasks.length === nextTasks.length &&
      column.tasks.every((item, index) => item === nextTasks[index]);
    return tasksUnchanged ? column : { ...column, tasks: nextTasks };
  });
}

function getTaskPosition(columns, taskId) {
  const column = columns.find((item) =>
    item.tasks.some((task) => String(task.id) === String(taskId))
  );
  if (!column) return null;

  return {
    columnId: column.id,
    index: column.tasks.findIndex(
      (task) => String(task.id) === String(taskId)
    ),
  };
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
const TASK_FILTER_DEFAULTS = {
  search: "",
  status: "all",
  priority: "all",
  label: "all",
};

function readTaskFiltersFromUrl(columns) {
  const params = new URLSearchParams(window.location.search);

  const status = params.get("status") || "all";
  const priority = params.get("priority") || "all";
  const label = params.get("label") || "all";

  const validStatuses = columns.map((column) => column.id);
  const validLabels = new Set(
    columns.flatMap((column) =>
      column.tasks.map((task) => task.label).filter(Boolean)
    )
  );

  return {
    ...TASK_FILTER_DEFAULTS,
    search: params.get("search") || "",
    status:
      status === "all" || validStatuses.includes(status) ? status : "all",
    priority:
      priority === "all" || ["Low", "Medium", "High"].includes(priority)
        ? priority
        : "all",
    label: label === "all" || validLabels.has(label) ? label : "all",
  };
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
  const [taskFilters, setTaskFilters] = useState(() =>
    readTaskFiltersFromUrl(columns)
  );
  const taskSearchQuery = taskFilters.search;
  function updateTaskFilter(name, value) {
    const nextFilters = { ...taskFilters, [name]: value };
    const params = new URLSearchParams(window.location.search);

    Object.entries(TASK_FILTER_DEFAULTS).forEach(([key, defaultValue]) => {
      if (nextFilters[key] === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, nextFilters[key]);
      }
    });

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

    if (name === "search") {
      window.history.replaceState(window.history.state, "", nextUrl);
    } else {
      window.history.pushState(window.history.state, "", nextUrl);
    }

    setTaskFilters(nextFilters);
  }
  useEffect(() => {
    function handlePopState() {
      setTaskFilters(readTaskFiltersFromUrl(columns));
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [columns]);
  function setTaskSearchQuery(value) {
    updateTaskFilter("search", value);
  }
  function clearTaskFilters() {
    const nextFilters = { ...TASK_FILTER_DEFAULTS };
    const params = new URLSearchParams(window.location.search);

    Object.keys(TASK_FILTER_DEFAULTS).forEach((key) => {
      params.delete(key);
    });

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;

    window.history.pushState(window.history.state, "", nextUrl);
    setTaskFilters(nextFilters);
  }
  const [defaultTaskDueDate, setDefaultTaskDueDate] = useState("");
  const [notifications, setNotifications] = useState(loadNotifications);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskRequestPending, setIsTaskRequestPending] = useState(false);
  const [taskRequestMessage, setTaskRequestMessage] = useState("");
  const [taskApiError, setTaskApiError] = useState("");
  const [taskMoveError, setTaskMoveError] = useState("");
  const [pendingTaskMoveCount, setPendingTaskMoveCount] = useState(0);
  const [taskFeedback, setTaskFeedback] = useState("");
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
  const taskRequestPendingRef = useRef(false);
  const taskMoveQueuesRef = useRef(new Map());
  const retryTaskRequestRef = useRef(null);
  const columnsRef = useRef(columns);
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

  useLayoutEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

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
    if (!taskAnnouncement) return;

    const timeoutId = window.setTimeout(() => {
      setTaskAnnouncement("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [taskAnnouncement]);

  useEffect(
    () =>
      subscribeToTaskChanges((savedColumns) => {
        let synchronizedColumns;
        try {
          const latestSavedValue = window.localStorage.getItem(
            TASK_STORAGE_KEY
          );
          if (
            latestSavedValue === null ||
            JSON.stringify(JSON.parse(latestSavedValue)) !==
              JSON.stringify(savedColumns)
          ) {
            return;
          }

          synchronizedColumns = normalizeTaskColumns(savedColumns);
        } catch (error) {
          console.error("Unable to synchronize saved task columns.", error);
          saveTasks(columnsRef.current);
          return;
        }

        if (
          JSON.stringify(synchronizedColumns) ===
          JSON.stringify(columnsRef.current)
        ) {
          return;
        }

        cancelPendingTaskMoves();
        setDraggedTaskId(null);
        setDropTargetColumnId(null);
        setDropIndicator(null);
        setKeyboardMove(null);
        commitTaskColumns(synchronizedColumns);
      }),
    []
  );

  useEffect(() => {
    saveTasks(columns);
  }, [columns]);

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
    setNotifications((previousNotifications) => [
      {
        id: crypto.randomUUID(),
        message,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...previousNotifications,
    ].slice(0, 20));
  }

  function markNotificationsRead() {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification.read ? notification : { ...notification, read: true }
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

    if (!previousColumn || !nextColumn || previousColumn.id === nextColumn.id) {
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
    if (taskRequestPendingRef.current || taskMoveQueuesRef.current.size > 0) return;
    setTaskApiError("");
    setTaskFeedback("");
    retryTaskRequestRef.current = null;
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
    if (taskRequestPendingRef.current || taskMoveQueuesRef.current.size > 0) return;
    setTaskApiError("");
    setTaskFeedback("");
    retryTaskRequestRef.current = null;
    returnFocusRef.current = triggerElement;
    setSelectedTask(task);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedTask(null);
  }

  async function runTaskRequest(
    request,
    onSuccess,
    loadingMessage,
    successMessage
  ) {
    if (
      taskRequestPendingRef.current ||
      taskMoveQueuesRef.current.size > 0
    ) return false;

    taskRequestPendingRef.current = true;
    setIsTaskRequestPending(true);
    setTaskRequestMessage(loadingMessage);
    setTaskApiError("");
    setTaskFeedback("");

    let response;
    try {
      response = await request();
    } catch (error) {
      setTaskApiError(
        error instanceof Error && error.message
          ? error.message
          : "The task request failed. Please try again."
      );
      retryTaskRequestRef.current = () => {
        void runTaskRequest(
          request,
          onSuccess,
          loadingMessage,
          successMessage
        );
      };
      return false;
    } finally {
      taskRequestPendingRef.current = false;
      setIsTaskRequestPending(false);
      setTaskRequestMessage("");
    }

    retryTaskRequestRef.current = null;
    setTaskApiError("");
    onSuccess(response);
    setTaskFeedback(successMessage);
    return true;
  }

  function saveTask(taskData) {
    if (taskMoveQueuesRef.current.size > 0) return;
    const editingTask = selectedTask;
    const status = taskData.status || "todo";
    const statusTaskCount =
      columnsRef.current.find((column) => column.id === status)?.tasks.length ||
      0;
    const taskPayload = {
      ...taskData,
      description: taskData.description.trim(),
      dueDate:
        taskData.dueDate || getStatusBasedDueDate(status, statusTaskCount),
      label: taskData.label.trim(),
      status,
    };
    const request = editingTask
      ? () => updateTaskRequest(editingTask.id, taskPayload)
      : () => createTaskRequest(taskPayload);
    const onSuccess = (savedTask) => {
      if (editingTask) {
        const currentColumns = columnsRef.current;
        const updatedTask = {
          ...editingTask,
          ...savedTask,
          id: editingTask.id,
        };
        const sourceColumn = currentColumns.find((column) =>
          column.tasks.some(
            (task) => String(task.id) === String(editingTask.id)
          )
        );
        const destinationColumn = currentColumns.find(
          (column) => column.id === updatedTask.status
        );
        const updatedColumns = currentColumns.map((column) => ({
          ...column,
          tasks: column.tasks.map((task) =>
            String(task.id) === String(editingTask.id) ? updatedTask : task
          ),
        }));
        const nextColumns =
          sourceColumn &&
          destinationColumn &&
          sourceColumn.id !== destinationColumn.id
            ? moveTaskToPosition(
                updatedColumns,
                editingTask.id,
                destinationColumn.id,
                destinationColumn.tasks.length
              )
            : updatedColumns;

        recordTaskStatusChange(currentColumns, nextColumns, editingTask.id);
        addNotification(`Task updated: ${updatedTask.title}.`);
        setColumns(nextColumns);
      } else {
        const createdTask = { ...taskPayload, ...savedTask };
        const targetColumn = createdTask.status || "todo";
        setColumns((previousColumns) =>
          previousColumns.map((column) =>
            column.id === targetColumn &&
            !column.tasks.some(
              (task) => String(task.id) === String(createdTask.id)
            )
              ? { ...column, tasks: [...column.tasks, createdTask] }
              : column
          )
        );
        addNotification(`Task created: ${createdTask.title}.`);
      }

      closeModal();
    };

    void runTaskRequest(
      request,
      onSuccess,
      editingTask ? "Saving task..." : "Creating task...",
      editingTask ? "Task updated." : "Task created."
    );
  }

  function deleteTask(taskId) {
    if (taskRequestPendingRef.current || taskMoveQueuesRef.current.size > 0) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    const deletedTask = columnsRef.current
      .flatMap((column) => column.tasks)
      .find((task) => String(task.id) === String(taskId));
    if (!deletedTask) return;

    void runTaskRequest(
      () => deleteTaskRequest(taskId),
      () => {
        setColumns((previousColumns) =>
          previousColumns.map((column) => ({
            ...column,
            tasks: column.tasks.filter(
              (task) => String(task.id) !== String(taskId)
            ),
          }))
        );
        addNotification(`Task deleted: ${deletedTask.title}.`);
      },
      "Deleting task...",
      "Task deleted."
    );
  }

  function commitTaskColumns(nextColumns) {
    if (nextColumns === columnsRef.current) return;
    columnsRef.current = nextColumns;
    setColumns(nextColumns);
  }

  function cancelPendingTaskMoves() {
    taskMoveQueuesRef.current.clear();
    setPendingTaskMoveCount(0);
  }

  function moveTask(taskId, destinationColumnId, insertionIndex, focusAfterMove = false) {
    if (taskRequestPendingRef.current) return;

    const currentColumns = columnsRef.current;
    const previousPosition = getTaskPosition(currentColumns, taskId);
    if (!previousPosition) return;

    const destinationColumn = currentColumns.find(
      (column) => column.id === destinationColumnId
    );
    if (!destinationColumn) return;

    const nextColumns = moveTaskToPosition(
      currentColumns,
      taskId,
      destinationColumnId,
      insertionIndex
    );
    if (nextColumns === currentColumns) return;

    const nextPosition = getTaskPosition(nextColumns, taskId);
    if (!nextPosition) return;

    if (focusAfterMove) {
      pendingKeyboardFocusTaskId.current = taskId;
    }

    commitTaskColumns(nextColumns);
    announceTaskMovement(currentColumns, nextColumns, taskId);
    setTaskMoveError("");

    if (previousPosition.columnId === nextPosition.columnId) return;

    const taskKey = String(taskId);
    let moveState = taskMoveQueuesRef.current.get(taskKey);
    if (!moveState) {
      moveState = {
        sequence: 0,
        queue: Promise.resolve(),
        confirmedPosition: previousPosition,
      };
      taskMoveQueuesRef.current.set(taskKey, moveState);
      setPendingTaskMoveCount(taskMoveQueuesRef.current.size);
    }

    moveState.sequence += 1;
    const sequence = moveState.sequence;
    const destinationId = nextPosition.columnId;
    const requestMove = () =>
      taskMoveQueuesRef.current.get(taskKey) === moveState
        ? updateTaskRequest(taskId, { status: destinationId })
        : undefined;
    moveState.queue = moveState.queue.then(requestMove, requestMove).then(
      () => {
        if (taskMoveQueuesRef.current.get(taskKey) !== moveState) return;

        const confirmedPosition = nextPosition;
        const previousConfirmedPosition = moveState.confirmedPosition;
        moveState.confirmedPosition = confirmedPosition;

        if (moveState.sequence !== sequence) return;

        if (previousConfirmedPosition.columnId !== confirmedPosition.columnId) {
          const task = columnsRef.current
            .flatMap((column) => column.tasks)
            .find((item) => String(item.id) === taskKey);
          const sourceColumn = columnsRef.current.find(
            (column) => column.id === previousConfirmedPosition.columnId
          );
          const targetColumn = columnsRef.current.find(
            (column) => column.id === confirmedPosition.columnId
          );
          if (task && sourceColumn && targetColumn) {
            addNotification(
              `${task.title} moved from ${sourceColumn.title} to ${targetColumn.title}.`
            );
          }
        }

        taskMoveQueuesRef.current.delete(taskKey);
        setPendingTaskMoveCount(taskMoveQueuesRef.current.size);
      },
      (error) => {
        if (
          taskMoveQueuesRef.current.get(taskKey) !== moveState ||
          moveState.sequence !== sequence
        ) return;

        const latestColumns = columnsRef.current;
        const rollbackColumns = moveTaskToPosition(
          latestColumns,
          taskId,
          moveState.confirmedPosition.columnId,
          moveState.confirmedPosition.index
        );
        if (rollbackColumns !== latestColumns) {
          commitTaskColumns(rollbackColumns);
          announceTaskMovement(latestColumns, rollbackColumns, taskId);
        }

        const taskTitle =
          latestColumns
            .flatMap((column) => column.tasks)
            .find((item) => String(item.id) === taskKey)?.title || "Task";
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Please try moving it again.";
        setTaskMoveError(`Unable to move ${taskTitle}. ${message}`);
        taskMoveQueuesRef.current.delete(taskKey);
        setPendingTaskMoveCount(taskMoveQueuesRef.current.size);
      }
    );
  }

  function handleTaskDragStart(taskId, event) {
    if (taskRequestPendingRef.current) return;
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
    const currentColumns = columnsRef.current;
    let targetPosition = null;

    if (targetTaskId !== null) {
      const bounds = event.currentTarget.getBoundingClientRect();
      targetPosition =
        event.clientY < bounds.top + bounds.height / 2 ? "before" : "after";
    }

    if (taskId) {
      const sourceColumnIndex = currentColumns.findIndex((column) =>
        column.tasks.some((task) => String(task.id) === taskId)
      );
      const destinationColumnIndex = currentColumns.findIndex(
        (column) => column.id === columnId
      );

      if (sourceColumnIndex !== -1 && destinationColumnIndex !== -1) {
        const destinationTasks = currentColumns[destinationColumnIndex].tasks.filter(
          (task) =>
            String(task.id) !== taskId
        );
        const targetIndex =
          targetTaskId === null
            ? destinationTasks.length
            : destinationTasks.findIndex(
            (item) => String(item.id) === String(targetTaskId)
          );

        if (targetIndex !== -1) {
          moveTask(
            taskId,
            columnId,
            targetIndex + (targetPosition === "after" ? 1 : 0)
          );
        }
      }
    }

    setDraggedTaskId(null);
    setDropTargetColumnId(null);
    setDropIndicator(null);
  }

  function handleTaskKeyDown(taskId, event) {
    if (
      event.target !== event.currentTarget ||
      taskRequestPendingRef.current
    ) return;

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

      moveTask(
        keyboardMove.taskId,
        keyboardMove.columnId,
        keyboardMove.index,
        true
      );

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

        {isTaskRequestPending && (
          <p className="task-request-status" role="status" aria-live="polite">
            {taskRequestMessage}
          </p>
        )}
        {pendingTaskMoveCount > 0 && (
          <p className="task-request-status" role="status" aria-live="polite">
            Saving task movement...
          </p>
        )}
        {taskApiError && !isModalOpen && (
          <div className="task-request-error" role="alert">
            <p>{taskApiError}</p>
            <button
              type="button"
              onClick={() => retryTaskRequestRef.current?.()}
              disabled={isTaskRequestPending}
            >
              Retry
            </button>
          </div>
        )}
        {taskMoveError && (
          <div className="task-request-error" role="alert">
            <p>{taskMoveError}</p>
          </div>
        )}
        {taskFeedback && (
          <p className="task-request-feedback" role="status" aria-live="polite">
            {taskFeedback}
          </p>
        )}

        {activePage === "help" ? (
          <HelpCenter onReturnToDashboard={() => setActivePage("dashboard")} />
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
            taskFilters={taskFilters}
            onFilterChange={updateTaskFilter}
            onClearFilters={clearTaskFilters}
            onCreateTask={openCreateModal}
            onEditTask={openEditModal}
            onDeleteTask={deleteTask}
            createButtonRef={triggerRef}
            isTaskActionDisabled={
              isTaskRequestPending || pendingTaskMoveCount > 0
            }
          />
        ) : (
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
                disabled={isTaskRequestPending || pendingTaskMoveCount > 0}
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
                  searchQuery={taskSearchQuery}
                  onEdit={openEditModal}
                  onDelete={deleteTask}
                  isTaskActionDisabled={
                    isTaskRequestPending || pendingTaskMoveCount > 0
                  }
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
            <div
              className={`task-movement-notification${taskAnnouncement ? " is-visible" : ""}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="task-movement-notification-icon" aria-hidden="true">
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
            onClearApiError={() => {
              setTaskApiError("");
              retryTaskRequestRef.current = null;
            }}
            onRetry={() => retryTaskRequestRef.current?.()}
            apiError={taskApiError}
            isSaving={isTaskRequestPending}
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
