import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

async function checkProgressAndReturnToDashboard(user, expected) {
  await user.click(screen.getByRole("link", { name: /Your Progress/ }));

  const progressPage = screen.getByRole("region", { name: "Your Progress" });
  const projectProgress = within(progressPage).getByRole("region", {
    name: "Project Progress",
  });
  const taskOverview = within(progressPage).getByRole("region", {
    name: "Task Overview",
  });

  expect(
    within(projectProgress)
      .getByRole("progressbar", { name: "Overall project completion" })
      .getAttribute("aria-valuenow")
  ).toBe(String(expected.percentage));
  expect(
    within(taskOverview)
      .getByRole("group", { name: "Total Tasks" })
      .textContent
  ).toContain(String(expected.total));
  expect(
    within(taskOverview)
      .getByRole("group", { name: "Completed Tasks" })
      .textContent
  ).toContain(String(expected.completed));
  expect(
    within(taskOverview)
      .getByRole("group", { name: "Pending Tasks" })
      .textContent
  ).toContain(String(expected.pending));
  expect(
    within(taskOverview)
      .getByRole("group", { name: "Overall Completion" })
      .textContent
  ).toContain(`${expected.percentage}%`);

  await user.click(screen.getByRole("link", { name: /Dashboard/ }));
}

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

    expect(
      screen.queryByRole("heading", { name: "Project Progress" })
    ).toBeNull();
    await checkProgressAndReturnToDashboard(user, {
      total: 10,
      completed: 3,
      pending: 7,
      percentage: 30,
    });

    await user.click(screen.getByRole("button", { name: /add task/i }));
    await user.type(screen.getByLabelText("Task Title *"), "Track dashboard count");
    await user.click(screen.getByRole("button", { name: "Create Task" }));

    await checkProgressAndReturnToDashboard(user, {
      total: 11,
      completed: 3,
      pending: 8,
      percentage: 27,
    });

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Delete Design landing page" }));

    await checkProgressAndReturnToDashboard(user, {
      total: 10,
      completed: 3,
      pending: 7,
      percentage: 30,
    });
  });

  it("updates the completed count when tasks move into and out of Done", async () => {
    const user = userEvent.setup();
    render(<App />);

    await checkProgressAndReturnToDashboard(user, {
      total: 10,
      completed: 3,
      pending: 7,
      percentage: 30,
    });

    let task = screen.getByRole("article", {
      name: /Design landing page, To Do/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowRight}{Enter}");
    await checkProgressAndReturnToDashboard(user, {
      total: 10,
      completed: 3,
      pending: 7,
      percentage: 30,
    });

    task = screen.getByRole("article", {
      name: /Design landing page, In Progress/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowRight}{Enter}");
    await checkProgressAndReturnToDashboard(user, {
      total: 10,
      completed: 4,
      pending: 6,
      percentage: 40,
    });

    task = screen.getByRole("article", {
      name: /Design landing page, Done/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowLeft}{Enter}");
    await checkProgressAndReturnToDashboard(user, {
      total: 10,
      completed: 3,
      pending: 7,
      percentage: 30,
    });

    task = screen.getByRole("article", {
      name: /Design landing page, In Progress/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowLeft}{Enter}");
    await checkProgressAndReturnToDashboard(user, {
      total: 10,
      completed: 3,
      pending: 7,
      percentage: 30,
    });
  });

  it("rounds the completion percentage to a whole number", async () => {
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

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: /Your Progress/ }));

    expect(
      screen.getByRole("progressbar", {
        name: "Overall project completion",
      }).getAttribute("aria-valuenow")
    ).toBe("67");
  });

  it("shows zero percent when there are no tasks", async () => {
    localStorage.setItem(
      "taskflow-team-board.columns",
      JSON.stringify([
        { id: "todo", tasks: [] },
        { id: "in-progress", tasks: [] },
        { id: "done", tasks: [] },
      ])
    );

    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: /Your Progress/ }));

    const progressPage = screen.getByRole("region", { name: "Your Progress" });
    const projectProgress = within(progressPage).getByRole("region", {
      name: "Project Progress",
    });
    const taskOverview = within(progressPage).getByRole("region", {
      name: "Task Overview",
    });
    const progress = within(projectProgress).getByRole("progressbar", {
      name: "Overall project completion",
    });
    const totalTasks = within(taskOverview).getByRole("group", {
      name: "Total Tasks",
    });
    const completedTasks = within(taskOverview).getByRole("group", {
      name: "Completed Tasks",
    });
    const pendingTasks = within(taskOverview).getByRole("group", {
      name: "Pending Tasks",
    });

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
    expect(
      screen.getByRole("heading", { name: "Keyboard Shortcuts" })
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Task Statuses and Priorities",
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("table", {
        name: "Keyboard controls available in TaskFlow",
      })
    ).toBeTruthy();
    expect(
      screen.getByText(/The header displays a Search tasks field/i)
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

  it("searches FAQ questions and expands or collapses answers", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: /Help/ }));

    const faqHeading = screen.getByRole("heading", {
      name: "Frequently Asked Questions (FAQs)",
    });
    expect(faqHeading).toBeTruthy();

    const search = screen.getByRole("searchbox", { name: "Search FAQs" });
    await user.type(search, "priorities");

    const priorityQuestion = screen.getByRole("button", {
      name: /What are task priorities/,
    });
    expect(priorityQuestion.getAttribute("aria-expanded")).toBe("false");
    expect(
      screen.queryByRole("button", { name: /How do I create a new task/ })
    ).toBeNull();

    await user.click(priorityQuestion);
    expect(priorityQuestion.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText(/High means the task needs attention first/i)).toBeTruthy();

    await user.click(priorityQuestion);
    expect(priorityQuestion.getAttribute("aria-expanded")).toBe("false");
  });
});
