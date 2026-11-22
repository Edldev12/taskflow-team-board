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

    const totalTasks = screen.getByRole("group", { name: "Total tasks" });
    expect(totalTasks.textContent).toContain("10");

    await user.click(screen.getByRole("button", { name: /add task/i }));
    await user.type(screen.getByLabelText("Task Title *"), "Track dashboard count");
    await user.click(screen.getByRole("button", { name: "Create Task" }));

    expect(totalTasks.textContent).toContain("11");

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete Design landing page" }));

    expect(totalTasks.textContent).toContain("10");
  });
});
