import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTask,
  deleteTask,
  getTasks,
  resetTasks,
  updateTask,
} from "../api/taskApi";

const REQUEST_DELAY = 600;

async function completeRequest(promise) {
  await vi.advanceTimersByTimeAsync(REQUEST_DELAY);
  return promise;
}

async function expectRequestToReject(promise, message) {
  const rejectionCheck = expect(promise).rejects.toThrow(message);
  await vi.advanceTimersByTimeAsync(REQUEST_DELAY);
  await rejectionCheck;
}

describe("taskApi", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    await resetTasks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns the initial list of tasks", async () => {
    const tasks = await completeRequest(getTasks());

    expect(tasks).toHaveLength(20);
    expect(tasks[0]).toMatchObject({
      id: 1,
      title: "Design landing page",
      status: "todo",
    });
  });

  it("waits for the configured delay before resolving a request", async () => {
    let requestResolved = false;
    const request = getTasks().then((tasks) => {
      requestResolved = true;
      return tasks;
    });

    await vi.advanceTimersByTimeAsync(REQUEST_DELAY - 1);
    expect(requestResolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(await request).toHaveLength(20);
    expect(requestResolved).toBe(true);
  });

  it("creates a task with default values", async () => {
    const createdTask = await completeRequest(
      createTask({ title: "Write tests" })
    );

    expect(createdTask).toMatchObject({
      title: "Write tests",
      description: "",
      label: "",
      priority: "Medium",
      status: "todo",
    });
    expect(createdTask.id).toBeTruthy();

    const tasks = await completeRequest(getTasks());
    expect(tasks).toContainEqual(createdTask);
  });

  it("generates distinct IDs and keeps IDs immutable during updates", async () => {
    const firstTask = await completeRequest(
      createTask({ title: "First task" })
    );
    const secondTask = await completeRequest(
      createTask({ title: "Second task" })
    );

    expect(firstTask.id).toBeTruthy();
    expect(secondTask.id).toBeTruthy();
    expect(secondTask.id).not.toBe(firstTask.id);

    const updatedTask = await completeRequest(
      updateTask(1, { id: 99, title: "Updated title" })
    );
    expect(updatedTask.id).toBe(1);
  });

  it("updates an existing task", async () => {
    const updatedTask = await completeRequest(
      updateTask(1, { title: "Updated title" })
    );

    expect(updatedTask.title).toBe("Updated title");
    expect(updatedTask.id).toBe(1);
  });

  it("rejects when updating a task that does not exist", async () => {
    await expectRequestToReject(
      updateTask("missing-task", { title: "Updated" }),
      "Task not found."
    );
  });

  it("deletes an existing task", async () => {
    const result = await completeRequest(deleteTask(1));

    expect(result).toEqual({ success: true, id: 1 });

    const tasks = await completeRequest(getTasks());
    expect(tasks.some((task) => task.id === 1)).toBe(false);
  });

  it("rejects when deleting a task that does not exist", async () => {
    await expectRequestToReject(
      deleteTask("missing-task"),
      "Task not found."
    );
  });

  it("simulates a request failure without changing the task list", async () => {
    Math.random.mockReturnValue(0.01);

    await expectRequestToReject(
      getTasks(),
      "Request failed. Please try again."
    );

    Math.random.mockReturnValue(0.5);

    const tasks = await completeRequest(getTasks());
    expect(tasks).toHaveLength(20);
  });

  it("does not commit create, update, or delete when a request fails", async () => {
    Math.random.mockReturnValue(0.01);

    await expectRequestToReject(
      createTask({ title: "Failed task" }),
      "Request failed. Please try again."
    );
    await expectRequestToReject(
      updateTask(1, { title: "Failed update" }),
      "Request failed. Please try again."
    );
    await expectRequestToReject(
      deleteTask(1),
      "Request failed. Please try again."
    );

    Math.random.mockReturnValue(0.5);
    const response = await completeRequest(getTasks());
    expect(response).toHaveLength(20);
    expect(response[0].title).toBe("Design landing page");
  });

  it("returns a copy so callers cannot mutate the internal task list", async () => {
    const tasks = await completeRequest(getTasks());
    tasks[0].title = "Changed outside the API";

    const nextTasks = await completeRequest(getTasks());
    expect(nextTasks[0].title).toBe("Design landing page");
  });
});