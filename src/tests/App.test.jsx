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
    expect(totalTasks.textContent).toContain("10");
    expect(pendingTasks.textContent).toContain("7");

    await user.click(screen.getByRole("button", { name: /add task/i }));
    await user.type(screen.getByLabelText("Task Title *"), "Track dashboard count");
    await user.click(screen.getByRole("button", { name: "Create Task" }));

    expect(totalTasks.textContent).toContain("11");
    expect(pendingTasks.textContent).toContain("8");

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete Design landing page" }));

    expect(totalTasks.textContent).toContain("10");
    expect(pendingTasks.textContent).toContain("7");
  });

  it("updates the completed count when tasks move into and out of Done", async () => {
    const user = userEvent.setup();
    render(<App />);

    const completedTasks = screen.getByRole("group", {
      name: "Completed Tasks",
    });
    const pendingTasks = screen.getByRole("group", { name: "Pending Tasks" });
    expect(completedTasks.textContent).toContain("3");
    expect(pendingTasks.textContent).toContain("7");

    let task = screen.getByRole("article", {
      name: /Design landing page, To Do/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowRight}{ArrowRight}{Enter}");
    expect(completedTasks.textContent).toContain("4");
    expect(pendingTasks.textContent).toContain("6");

    task = screen.getByRole("article", {
      name: /Design landing page, Done/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowLeft}{ArrowLeft}{Enter}");
    expect(completedTasks.textContent).toContain("3");
    expect(pendingTasks.textContent).toContain("7");
  });
});
