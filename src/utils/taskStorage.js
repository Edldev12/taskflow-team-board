const STORAGE_KEY = "taskflow-team-board.columns";

export function saveTasks(columns) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    return true;
  } catch (error) {
    console.error("Failed to save tasks:", error);
    return false;
  }
}

export function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return null;

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
    if (event.key !== STORAGE_KEY || !event.newValue) return;

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