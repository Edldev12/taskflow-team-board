import initialTasks from "../data/tasks.json";
import { TASK_STORAGE_KEY } from "../utils/taskStorage";

const DELAY = 600;
const FAILURE_RATE = 0.1;

const taskColumns = [
  { id: "todo", title: "To Do", color: "blue" },
  { id: "in-progress", title: "In Progress", color: "orange" },
  { id: "done", title: "Done", color: "green" },
];

function simulateRequest() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < FAILURE_RATE) {
        reject(new Error("Request failed. Please try again."));
      } else {
        resolve();
      }
    }, DELAY);
  });
}

function readStoredColumns() {
  const saved = window.localStorage.getItem(TASK_STORAGE_KEY);
  if (saved === null) return null;

  const columns = JSON.parse(saved);
  if (
    !Array.isArray(columns) ||
    columns.some((column) => !column || !Array.isArray(column.tasks))
  ) {
    throw new Error("Saved task data is invalid.");
  }

  return columns;
}

function tasksFromColumns(columns) {
  return columns.flatMap((column) =>
    column.tasks.map((task) => ({ ...task, status: column.id }))
  );
}

function columnsFromTasks(taskList) {
  return taskColumns.map((column) => ({
    ...column,
    tasks: taskList
      .filter((task) => (task.status || "todo") === column.id)
      .map((task) => ({ ...task, status: column.id })),
  }));
}

function saveColumns(columns) {
  window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(columns));
}

function getCurrentTasks(columns) {
  return columns === null ? initialTasks : tasksFromColumns(columns);
}

export async function getTasks() {
  await simulateRequest();
  return structuredClone(getCurrentTasks(readStoredColumns()));
}

export async function createTask(taskData) {
  await simulateRequest();

  const columns = readStoredColumns();
  const currentTasks = getCurrentTasks(columns);
  let id = crypto.randomUUID();
  while (currentTasks.some((task) => String(task.id) === String(id))) {
    id = crypto.randomUUID();
  }

  const newTask = {
    ...taskData,
    id,
    description: taskData.description || "",
    label: taskData.label || "",
    priority: taskData.priority || "Medium",
    status: taskData.status || "todo",
  };

  const currentColumns =
    columns === null ? columnsFromTasks(currentTasks) : columns;
  const targetColumn = currentColumns.find(
    (column) => column.id === newTask.status
  );
  if (!targetColumn) {
    throw new Error(`Task status "${newTask.status}" is not available.`);
  }

  saveColumns(
    currentColumns.map((column) =>
      column === targetColumn
        ? { ...column, tasks: [...column.tasks, newTask] }
        : column
    )
  );

  return structuredClone(newTask);
}

export async function updateTask(taskId, updates) {
  await simulateRequest();

  const columns = readStoredColumns();
  const currentTasks = getCurrentTasks(columns);
  const existingTask = currentTasks.find(
    (task) => String(task.id) === String(taskId)
  );

  if (!existingTask) {
    throw new Error("Task not found.");
  }

  const updatedTask = {
    ...existingTask,
    ...updates,
    id: existingTask.id,
  };

  const currentColumns =
    columns === null ? columnsFromTasks(currentTasks) : columns;
  const sourceColumn = currentColumns.find((column) =>
    column.tasks.some((task) => String(task.id) === String(taskId))
  );
  const destinationStatus = updates.status || sourceColumn.id;
  const destinationColumn = currentColumns.find(
    (column) => column.id === destinationStatus
  );

  if (!destinationColumn) {
    throw new Error(`Task status "${destinationStatus}" is not available.`);
  }

  const taskWithStatus = { ...updatedTask, status: destinationColumn.id };
  const nextColumns = currentColumns.map((column) => ({
    ...column,
    tasks: column.tasks.filter(
      (task) => String(task.id) !== String(taskId)
    ),
  }));
  const targetColumn = nextColumns.find(
    (column) => column.id === destinationColumn.id
  );
  const originalIndex = sourceColumn.tasks.findIndex(
    (task) => String(task.id) === String(taskId)
  );

  if (sourceColumn.id === destinationColumn.id) {
    targetColumn.tasks.splice(originalIndex, 0, taskWithStatus);
  } else {
    targetColumn.tasks.push(taskWithStatus);
  }

  saveColumns(nextColumns);

  return structuredClone(updatedTask);
}

export async function deleteTask(taskId) {
  await simulateRequest();

  const columns = readStoredColumns();
  const currentTasks = getCurrentTasks(columns);
  const exists = currentTasks.some(
    (task) => String(task.id) === String(taskId)
  );

  if (!exists) {
    throw new Error("Task not found.");
  }

  const currentColumns =
    columns === null ? columnsFromTasks(currentTasks) : columns;
  saveColumns(
    currentColumns.map((column) => ({
      ...column,
      tasks: column.tasks.filter(
        (task) => String(task.id) !== String(taskId)
      ),
    }))
  );

  return { success: true, id: taskId };
}

export async function resetTasks() {
  window.localStorage.removeItem(TASK_STORAGE_KEY);
  return structuredClone(initialTasks);
}
