import initialTasks from "../data/tasks.json";

const DELAY = 600;
const FAILURE_RATE = 0.1;

let tasks = structuredClone(initialTasks);

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

export async function getTasks() {
  await simulateRequest();
  return structuredClone(tasks);
}

export async function createTask(taskData) {
  await simulateRequest();

  let id = crypto.randomUUID();
  while (tasks.some((task) => String(task.id) === String(id))) {
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

  tasks = [...tasks, newTask];

  return structuredClone(newTask);
}

export async function updateTask(taskId, updates) {
  await simulateRequest();

  const taskIndex = tasks.findIndex(
    (task) => String(task.id) === String(taskId)
  );

  if (taskIndex === -1) {
    throw new Error("Task not found.");
  }

  const updatedTask = {
    ...tasks[taskIndex],
    ...updates,
    id: tasks[taskIndex].id,
  };
  tasks = tasks.map((task, index) =>
    index === taskIndex ? updatedTask : task
  );

  return structuredClone(updatedTask);
}

export async function deleteTask(taskId) {
  await simulateRequest();

  const exists = tasks.some(
    (task) => String(task.id) === String(taskId)
  );

  if (!exists) {
    throw new Error("Task not found.");
  }

  tasks = tasks.filter(
    (task) => String(task.id) !== String(taskId)
  );

  return { success: true, id: taskId };
}

export async function resetTasks() {
  tasks = structuredClone(initialTasks);
  return structuredClone(tasks);
}