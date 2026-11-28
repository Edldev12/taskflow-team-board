import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

const REQUEST_DELAY = 600;
const TASK_STORAGE_KEY = "taskflow-team-board.columns";

async function completeRequest() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY));
  });
}

function findTask(title) {
  return screen.getByRole("article", { name: new RegExp(title) });
}

describe("task persistence integration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps created, edited, and deleted tasks synchronized after reload", async () => {
    const user = userEvent.setup();
    let app = render(<App />);

    await user.click(screen.getByRole("button", { name: /add task/i }));
    await user.type(
      screen.getByLabelText("Task Title *"),
      "Persistent integration task"
    );
    await user.click(screen.getByRole("button", { name: "Create Task" }));
    await completeRequest();

    expect(screen.getByRole("article", {
      name: /Persistent integration task, To Do/,
    })).toBeTruthy();

    const createdColumns = JSON.parse(localStorage.getItem(TASK_STORAGE_KEY));
    const createdTask = createdColumns
      .flatMap((column) => column.tasks)
      .find((task) => task.title === "Persistent integration task");
    expect(createdTask).toBeTruthy();

    app.unmount();
    app = render(<App />);
    expect(findTask("Persistent integration task")).toBeTruthy();

    await user.click(
      within(findTask("Persistent integration task")).getByRole("button", {
        name: "Edit Persistent integration task",
      })
    );
    const editDialog = screen.getByRole("dialog", { name: "Edit Task" });
    const titleInput = within(editDialog).getByLabelText("Task Title *");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated integration task");
    await user.click(
      within(editDialog).getByRole("button", { name: "Save Changes" })
    );
    await completeRequest();

    expect(screen.getByRole("article", {
      name: /Updated integration task, To Do/,
    })).toBeTruthy();

    app.unmount();
    app = render(<App />);
    expect(findTask("Updated integration task")).toBeTruthy();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(
      within(findTask("Updated integration task")).getByRole("button", {
        name: "Delete Updated integration task",
      })
    );
    await completeRequest();

    expect(
      screen.queryByRole("article", { name: /Updated integration task/ })
    ).toBeNull();
    const deletedColumns = JSON.parse(localStorage.getItem(TASK_STORAGE_KEY));
    expect(
      deletedColumns
        .flatMap((column) => column.tasks)
        .some((task) => String(task.id) === String(createdTask.id))
    ).toBe(false);

    app.unmount();
    render(<App />);
    expect(
      screen.queryByRole("article", { name: /Updated integration task/ })
    ).toBeNull();
  });
});
