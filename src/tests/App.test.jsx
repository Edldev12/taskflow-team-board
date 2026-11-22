import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("dashboard task statistics", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("counts tasks across columns and updates after creating and deleting a task", async () => {
    const user = userEvent.setup();
    render(<App />);

    const totalTasks = screen.getByRole("group", { name: "Total Tasks" });
    const pendingTasks = screen.getByRole("group", { name: "Pending Tasks" });
    const progress = screen.getByRole("progressbar", {
      name: "Overall project completion",
    });
    expect(totalTasks.textContent).toContain("10");
    expect(pendingTasks.textContent).toContain("7");
    expect(progress.getAttribute("aria-valuenow")).toBe("30");

    await user.click(screen.getByRole("button", { name: /add task/i }));
    await user.type(screen.getByLabelText("Task Title *"), "Track dashboard count");
    await user.click(screen.getByRole("button", { name: "Create Task" }));

    expect(totalTasks.textContent).toContain("11");
    expect(pendingTasks.textContent).toContain("8");
    expect(progress.getAttribute("aria-valuenow")).toBe("27");

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete Design landing page" }));

    expect(totalTasks.textContent).toContain("10");
    expect(pendingTasks.textContent).toContain("7");
    expect(progress.getAttribute("aria-valuenow")).toBe("30");
  });

  it("updates the completed count when tasks move into and out of Done", async () => {
    const user = userEvent.setup();
    render(<App />);

    const completedTasks = screen.getByRole("group", {
      name: "Completed Tasks",
    });
    const pendingTasks = screen.getByRole("group", { name: "Pending Tasks" });
    const progress = screen.getByRole("progressbar", {
      name: "Overall project completion",
    });
    expect(completedTasks.textContent).toContain("3");
    expect(pendingTasks.textContent).toContain("7");
    expect(progress.getAttribute("aria-valuenow")).toBe("30");

    let task = screen.getByRole("article", {
      name: /Design landing page, To Do/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowRight}{Enter}");
    expect(pendingTasks.textContent).toContain("7");
    expect(progress.getAttribute("aria-valuenow")).toBe("30");

    task = screen.getByRole("article", {
      name: /Design landing page, In Progress/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowRight}{Enter}");
    expect(completedTasks.textContent).toContain("4");
    expect(pendingTasks.textContent).toContain("6");
    expect(progress.getAttribute("aria-valuenow")).toBe("40");

    task = screen.getByRole("article", {
      name: /Design landing page, Done/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowLeft}{Enter}");
    expect(pendingTasks.textContent).toContain("7");
    expect(progress.getAttribute("aria-valuenow")).toBe("30");

    task = screen.getByRole("article", {
      name: /Design landing page, In Progress/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowLeft}{Enter}");
    expect(completedTasks.textContent).toContain("3");
    expect(pendingTasks.textContent).toContain("7");
    expect(progress.getAttribute("aria-valuenow")).toBe("30");
  });

  it("rounds the completion percentage to a whole number", () => {
    localStorage.setItem(
      "taskflow-team-board.columns",
      JSON.stringify([
        { id: "todo", tasks: [{ id: 1, title: "Pending", label: "", priority: "Low" }] },
        { id: "in-progress", tasks: [] },
        {
          id: "done",
          tasks: [
            { id: 2, title: "Done one", label: "", priority: "Low" },
            { id: 3, title: "Done two", label: "", priority: "Low" },
          ],
        },
      ])
    );

    render(<App />);

    expect(
      screen.getByRole("progressbar", {
        name: "Overall project completion",
      }).getAttribute("aria-valuenow")
    ).toBe("67");
  });

  it("shows zero percent when there are no tasks", () => {
    localStorage.setItem(
      "taskflow-team-board.columns",
      JSON.stringify([
        { id: "todo", tasks: [] },
        { id: "in-progress", tasks: [] },
        { id: "done", tasks: [] },
      ])
    );

    render(<App />);

    const progress = screen.getByRole("progressbar", {
      name: "Overall project completion",
    });
    const totalTasks = screen.getByRole("group", { name: "Total Tasks" });
    const completedTasks = screen.getByRole("group", {
      name: "Completed Tasks",
    });
    const pendingTasks = screen.getByRole("group", { name: "Pending Tasks" });

    expect(progress.getAttribute("aria-valuenow")).toBe("0");
    expect(totalTasks.textContent).toContain("0");
    expect(completedTasks.textContent).toContain("0");
    expect(pendingTasks.textContent).toContain("0");
  });

  it("opens the task creation guide from Help and returns to the dashboard", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /Help/ }));

    const helpHeading = screen.getByRole("heading", {
      name: "Help Center",
    });
    expect(document.activeElement).toBe(helpHeading);
    expect(
      screen.getByRole("heading", { name: "How to Create Tasks" })
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "How to Edit and Delete Tasks" })
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "How to Use Drag and Drop" })
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Edit a task" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Delete a task" })).toBeTruthy();
    expect(
      screen.getByText(
        "Required. Keep it under 100 characters and make the action clear."
      )
    ).toBeTruthy();
    expect(screen.getByText(/free text/i)).toBeTruthy();
    expect(screen.getByText(/Status is not selected in the creation form/i)).toBeTruthy();
    expect(screen.getByText(/choose OK to remove the task or Cancel to keep it/i)).toBeTruthy();
    expect(screen.getByText(/Deletion has no undo in this app/i)).toBeTruthy();
    expect(screen.getByText(/If a drop is not accepted, the task stays where it was/i)).toBeTruthy();
    expect(screen.getByText(/Reorder tasks in a column/i)).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Return to Dashboard" })
    );

    expect(screen.getByRole("heading", { name: "My Tasks" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /add task/i })).toBeTruthy();
  });
});
