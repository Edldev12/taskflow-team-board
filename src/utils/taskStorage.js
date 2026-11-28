export const TASK_STORAGE_KEY = "taskflow-team-board.columns";

export function saveTasks(columns) {
  try {
    const serializedColumns = JSON.stringify(columns);
    if (localStorage.getItem(TASK_STORAGE_KEY) === serializedColumns) return true;

    localStorage.setItem(TASK_STORAGE_KEY, serializedColumns);
    return true;
  } catch (error) {
    console.error("Failed to save tasks:", error);
    return false;
  }
}

export function loadTasks() {
  try {
    const saved = localStorage.getItem(TASK_STORAGE_KEY);

    if (saved === null) return null;

    const columns = JSON.parse(saved);

    if (!Array.isArray(columns)) {
      throw new Error("Invalid saved task data.");
    }

    return columns;
  } catch (error) {
    console.error("Failed to load tasks:", error);
    return null;
  }
}

export function subscribeToTaskChanges(callback) {
  function handleStorageChange(event) {
    if (event.key !== TASK_STORAGE_KEY || !event.newValue) return;

    try {
      const columns = JSON.parse(event.newValue);

      if (Array.isArray(columns)) {
        callback(columns);
      }
    } catch (error) {
      console.error("Failed to synchronize tasks:", error);
    }
  }

  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}