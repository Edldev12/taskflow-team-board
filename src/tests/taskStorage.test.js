import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadTasks,
  saveTasks,
  subscribeToTaskChanges,
} from "../utils/taskStorage";

const STORAGE_KEY = "taskflow-team-board.columns";

const sampleColumns = [
  {
    id: "todo",
    title: "To Do",
    color: "blue",
    tasks: [
      {
        id: 1,
        title: "Test persistence",
        label: "Testing",
        priority: "High",
      },
    ],
  },
];

describe("taskStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves columns to localStorage", () => {
    expect(saveTasks(sampleColumns)).toBe(true);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(sampleColumns);
  });

  it("loads saved columns from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleColumns));

    expect(loadTasks()).toEqual(sampleColumns);
  });

  it("returns null when there is no saved data", () => {
    expect(loadTasks()).toBeNull();
  });

  it("returns null when saved JSON is invalid", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, "{invalid json");

    expect(loadTasks()).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("returns null when saved data is not an array", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: [] }));

    expect(loadTasks()).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("returns false if localStorage cannot save data", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage is unavailable");
    });

    expect(saveTasks(sampleColumns)).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("notifies subscribers when another tab changes the saved board", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToTaskChanges(callback);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: JSON.stringify(sampleColumns),
      })
    );

    expect(callback).toHaveBeenCalledWith(sampleColumns);
    unsubscribe();
  });

  it("ignores storage changes for other keys", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToTaskChanges(callback);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "some-other-key",
        newValue: JSON.stringify(sampleColumns),
      })
    );

    expect(callback).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("stops listening after unsubscribe is called", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToTaskChanges(callback);
    unsubscribe();

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: JSON.stringify(sampleColumns),
      })
    );

    expect(callback).not.toHaveBeenCalled();
  });
});