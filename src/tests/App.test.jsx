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
    const completion = screen.getByRole("group", {
      name: "Completion Percentage",
    });
    expect(totalTasks.textContent).toContain("10");
    expect(pendingTasks.textContent).toContain("7");
    expect(completion.textContent).toContain("30%");

    await user.click(screen.getByRole("button", { name: /add task/i }));
    await user.type(screen.getByLabelText("Task Title *"), "Track dashboard count");
    await user.click(screen.getByRole("button", { name: "Create Task" }));

    expect(totalTasks.textContent).toContain("11");
    expect(pendingTasks.textContent).toContain("8");
    expect(completion.textContent).toContain("27%");

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete Design landing page" }));

    expect(totalTasks.textContent).toContain("10");
    expect(pendingTasks.textContent).toContain("7");
    expect(completion.textContent).toContain("30%");
  });

  it("updates the completed count when tasks move into and out of Done", async () => {
    const user = userEvent.setup();
    render(<App />);

    const completedTasks = screen.getByRole("group", {
      name: "Completed Tasks",
    });
    const pendingTasks = screen.getByRole("group", { name: "Pending Tasks" });
    const completion = screen.getByRole("group", {
      name: "Completion Percentage",
    });
    expect(completedTasks.textContent).toContain("3");
    expect(pendingTasks.textContent).toContain("7");
    expect(completion.textContent).toContain("30%");

    let task = screen.getByRole("article", {
      name: /Design landing page, To Do/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowRight}{ArrowRight}{Enter}");
    expect(completedTasks.textContent).toContain("4");
    expect(pendingTasks.textContent).toContain("6");
    expect(completion.textContent).toContain("40%");

    task = screen.getByRole("article", {
      name: /Design landing page, Done/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowLeft}{ArrowLeft}{Enter}");
    expect(completedTasks.textContent).toContain("3");
    expect(pendingTasks.textContent).toContain("7");
    expect(completion.textContent).toContain("30%");
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
      screen.getByRole("group", { name: "Completion Percentage" }).textContent
    ).toContain("67%");
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

    const completion = screen.getByRole("group", {
      name: "Completion Percentage",
    });
    const progress = screen.getByRole("progressbar", {
      name: "Task completion",
    });

    expect(completion.textContent).toContain("0%");
    expect(progress.getAttribute("aria-valuenow")).toBe("0");
  });
});
