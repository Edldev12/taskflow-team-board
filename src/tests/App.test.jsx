import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

let originalWindowMatchMedia;

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
    vi.unstubAllGlobals();
    vi.useRealTimers();
    if (originalWindowMatchMedia === undefined) {
      delete window.matchMedia;
    } else {
      window.matchMedia = originalWindowMatchMedia;
    }
    originalWindowMatchMedia = undefined;
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

  it("supports saved theme choices and follows device changes in system mode", async () => {
    let handleSystemThemeChange;
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn((eventName, listener) => {
        handleSystemThemeChange = listener;
      }),
      removeEventListener: vi.fn(),
    };
    originalWindowMatchMedia = window.matchMedia;
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));
    window.matchMedia = vi.fn(() => mediaQuery);

    const user = userEvent.setup();
    const { container } = render(<App />);
    const appLayout = container.querySelector(".app-layout");

    expect(appLayout.getAttribute("data-theme")).toBe("dark");

    await user.click(screen.getByRole("link", { name: /Settings/ }));
    const appearanceSection = screen.getByRole("region", {
      name: "Appearance",
    });
    expect(
      screen.getByRole("heading", { name: "Appearance" })
    ).toBeTruthy();
    expect(within(appearanceSection).getByRole("status").textContent).toContain(
      "Currently active: Dark Mode"
    );

    await user.click(screen.getByRole("button", { name: /Light Mode/ }));
    expect(appLayout.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("taskflow-team-board.theme")).toBe("light");

    act(() => handleSystemThemeChange({ matches: false }));
    expect(appLayout.getAttribute("data-theme")).toBe("light");

    await user.click(
      screen.getByRole("button", { name: /Use device preference/ })
    );
    expect(localStorage.getItem("taskflow-team-board.theme")).toBeNull();
    act(() => handleSystemThemeChange({ matches: true }));
    expect(appLayout.getAttribute("data-theme")).toBe("dark");
    expect(
      within(appearanceSection).getByRole("status").textContent
    ).toContain("following your device preference");
  });

  it("switches the shared theme from the header icon controls", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const header = screen.getByRole("banner");
    const darkModeButton = within(header).getByRole("button", {
      name: "Dark mode",
    });

    await user.click(darkModeButton);
    expect(container.querySelector(".app-layout").dataset.theme).toBe("dark");
    expect(darkModeButton.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem("taskflow-team-board.theme")).toBe("dark");

    await user.click(within(header).getByRole("button", { name: "Light mode" }));
    expect(container.querySelector(".app-layout").dataset.theme).toBe("light");
    expect(localStorage.getItem("taskflow-team-board.theme")).toBe("light");
  });

  it("counts task activity, shows it from the bell, and restores notifications", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);

    expect(
      screen.getByRole("button", { name: "Notifications" }).querySelector(
        ".notification-count"
      )
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: /add task/i }));
    await user.type(screen.getByLabelText("Task Title *"), "Notification test task");
    await user.click(screen.getByRole("button", { name: "Create Task" }));

    const task = screen.getByRole("article", {
      name: /Design landing page, To Do/,
    });
    await user.click(task);
    await user.keyboard("{Enter}{ArrowRight}{Enter}");

    const notificationButton = screen.getByRole("button", {
      name: "Notifications, 2 unread",
    });
    expect(notificationButton.querySelector(".notification-count").textContent).toBe(
      "2"
    );

    await user.click(notificationButton);
    const notificationPanel = screen.getByRole("region", {
      name: "Notifications",
    });
    expect(
      within(notificationPanel).getByText(
        "Design landing page moved from To Do to In Progress."
      )
    ).toBeTruthy();
    expect(
      within(notificationPanel).getByText(
        "Task created: Notification test task."
      )
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Notifications" }).querySelector(
        ".notification-count"
      )
    ).toBeNull();
    expect(
      JSON.parse(localStorage.getItem("taskflow-team-board.notifications"))
    ).toHaveLength(2);

    firstRender.unmount();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(
      screen.getByRole("region", { name: "Notifications" }).textContent
    ).toContain("Design landing page moved from To Do to In Progress.");
  });

  it("opens a responsive monthly calendar from the sidebar and navigates months", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /Calendar/ }));

    const calendarPage = screen.getByRole("region", { name: "Calendar" });
    const calendarLink = screen.getByRole("link", { name: /Calendar/ });
    expect(calendarLink.getAttribute("aria-current")).toBe("page");
    expect(within(calendarPage).getByRole("heading", { name: "Calendar" })).toBeTruthy();

    const today = new Date();
    const expectedMonth = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(today);
    let calendarTable = within(calendarPage).getByRole("table", {
      name: `${expectedMonth} calendar`,
    });
    expect(
      within(calendarTable).getAllByRole("columnheader").map((header) =>
        header.getAttribute("aria-label")
      )
    ).toEqual([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);

    const dateCells = within(calendarTable).getAllByRole("cell");
    expect(dateCells).toHaveLength(42);
    const firstVisibleDate = new Date(
      `${dateCells[0].querySelector("time").dateTime}T12:00:00`
    );
    expect(firstVisibleDate.getDay()).toBe(0);
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstOfMonthIndex = dateCells.findIndex(
      (cell) => cell.querySelector("time").dateTime ===
        `${firstOfMonth.getFullYear()}-${String(firstOfMonth.getMonth() + 1).padStart(2, "0")}-01`
    );
    expect(firstOfMonthIndex % 7).toBe(firstOfMonth.getDay());
    const highlightedToday = dateCells.filter(
      (cell) => cell.getAttribute("aria-current") === "date"
    );
    expect(highlightedToday).toHaveLength(1);
    expect(highlightedToday[0].querySelector("time").dateTime).toBe(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    );

    const formatMonthLabel = (date) =>
      new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }).format(date);
    for (let monthIndex = today.getMonth(); monthIndex < 11; monthIndex += 1) {
      await user.click(screen.getByRole("button", { name: "Next month" }));
    }

    const december = new Date(today.getFullYear(), 11, 1);
    let decemberTable = screen.getByRole("table", {
      name: `${formatMonthLabel(december)} calendar`,
    });
    expect(within(decemberTable).getAllByRole("cell")).toHaveLength(42);

    await user.click(screen.getByRole("button", { name: "Next month" }));
    const january = new Date(today.getFullYear() + 1, 0, 1);
    const januaryTable = screen.getByRole("table", {
      name: `${formatMonthLabel(january)} calendar`,
    });
    const januaryCells = within(januaryTable).getAllByRole("cell");
    const januaryDates = januaryCells.map(
      (cell) => cell.querySelector("time").dateTime
    );
    expect(januaryCells).toHaveLength(42);
    expect(new Set(januaryDates).size).toBe(42);
    const januaryFirstIndex = januaryDates.indexOf(
      `${january.getFullYear()}-01-01`
    );
    expect(januaryFirstIndex % 7).toBe(january.getDay());

    await user.click(screen.getByRole("button", { name: "Previous month" }));
    decemberTable = screen.getByRole("table", {
      name: `${formatMonthLabel(december)} calendar`,
    });
    expect(decemberTable).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Today" }));
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    expect(
      screen.getByRole("table", {
        name: `${formatMonthLabel(currentMonth)} calendar`,
      })
    ).toBeTruthy();

    const followingMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const followingMonthLabel = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(followingMonth);
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(
      screen.getByRole("table", {
        name: `${followingMonthLabel} calendar`,
      })
    ).toBeTruthy();
  });

  it("navigates between Dashboard and My Tasks", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /Calendar/ }));
    await user.click(screen.getByRole("link", { name: /My Tasks/ }));

    expect(screen.getByRole("heading", { name: "My Tasks" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /My Tasks/ }).getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: /Dashboard/ }).getAttribute("aria-current")
    ).toBeNull();

    await user.click(screen.getByRole("link", { name: /Dashboard/ }));
    expect(
      screen.getByRole("link", { name: /Dashboard/ }).getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: /My Tasks/ }).getAttribute("aria-current")
    ).toBeNull();
  });

  it("shows all shared tasks and reflects create, edit, and delete changes", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App />);

    await user.click(screen.getByRole("link", { name: /My Tasks/ }));

    let myTasksPage = screen.getByRole("region", { name: "My Tasks" });
    expect(
      within(myTasksPage).getByRole("group", { name: "Total Tasks" }).textContent
    ).toContain("10");
    const initialTask = within(myTasksPage).getByRole("article", {
      name: "Design landing page, To Do",
    });
    expect(within(initialTask).getByText("No description provided.")).toBeTruthy();
    expect(within(initialTask).getByText("To Do")).toBeTruthy();
    expect(within(initialTask).getByText("Design")).toBeTruthy();
    expect(within(initialTask).getByText("High")).toBeTruthy();
    expect(initialTask.querySelector("time")?.getAttribute("dateTime")).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );

    await user.click(within(myTasksPage).getByRole("button", { name: "Add Task" }));
    await user.type(screen.getByLabelText("Task Title *"), "Track My Tasks updates");
    await user.type(screen.getByLabelText("Description"), "Keep this list current.");
    await user.click(screen.getByRole("button", { name: "Create Task" }));

    await user.click(screen.getByRole("link", { name: /Dashboard/ }));
    expect(
      screen.getByRole("article", {
        name: /Track My Tasks updates, To Do/,
      })
    ).toBeTruthy();
    await user.click(screen.getByRole("link", { name: /My Tasks/ }));
    myTasksPage = screen.getByRole("region", { name: "My Tasks" });

    expect(
      within(myTasksPage).getByRole("group", { name: "Total Tasks" }).textContent
    ).toContain("11");
    expect(
      within(myTasksPage).getByRole("article", {
        name: "Track My Tasks updates, To Do",
      })
    ).toBeTruthy();
    expect(within(myTasksPage).getByText("Keep this list current.")).toBeTruthy();

    await user.click(
      within(myTasksPage).getByRole("button", {
        name: "Edit Track My Tasks updates",
      })
    );
    const editDialog = screen.getByRole("dialog", { name: "Edit Task" });
    const titleInput = screen.getByLabelText("Task Title *");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated My Tasks item");
    await user.selectOptions(within(editDialog).getByLabelText("Status"), "done");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(
      within(myTasksPage).getByRole("article", {
        name: "Updated My Tasks item, Done",
      })
    ).toBeTruthy();

    await user.click(screen.getByRole("link", { name: /Dashboard/ }));
    expect(
      screen.getByRole("article", {
        name: /Updated My Tasks item, Done/,
      })
    ).toBeTruthy();
    await user.click(screen.getByRole("link", { name: /My Tasks/ }));
    myTasksPage = screen.getByRole("region", { name: "My Tasks" });

    await user.click(
      within(myTasksPage).getByRole("button", {
        name: "Delete Updated My Tasks item",
      })
    );
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(
      within(myTasksPage).getByRole("article", {
        name: "Updated My Tasks item, Done",
      })
    ).toBeTruthy();

    confirmSpy.mockReturnValue(true);
    await user.click(
      within(myTasksPage).getByRole("button", {
        name: "Delete Updated My Tasks item",
      })
    );
    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(
      within(myTasksPage).getByRole("group", { name: "Total Tasks" }).textContent
    ).toContain("10");
    expect(
      within(myTasksPage).queryByRole("article", {
        name: "Updated My Tasks item, Done",
      })
    ).toBeNull();
  });

  it("filters My Tasks by status and priority together and clears unmatched filters", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /My Tasks/ }));

    const myTasksPage = screen.getByRole("region", { name: "My Tasks" });
    const statusFilter = within(myTasksPage).getByLabelText("Status");
    const priorityFilter = within(myTasksPage).getByLabelText("Priority");

    expect(
      within(priorityFilter).getAllByRole("option").map((option) => option.value)
    ).toEqual(["all", "Low", "Medium", "High"]);

    await user.selectOptions(statusFilter, "done");
    expect(within(myTasksPage).getAllByRole("article")).toHaveLength(3);
    expect(within(myTasksPage).getByText("Showing 3 of 10 tasks")).toBeTruthy();
    expect(
      within(myTasksPage).getByRole("article", {
        name: "Set up React project, Done",
      })
    ).toBeTruthy();

    await user.selectOptions(statusFilter, "all");
    expect(within(myTasksPage).getAllByRole("article")).toHaveLength(10);

    await user.selectOptions(statusFilter, "in-progress");
    await user.selectOptions(priorityFilter, "High");
    expect(within(myTasksPage).getAllByRole("article")).toHaveLength(2);
    expect(
      within(myTasksPage).getByRole("article", {
        name: "Build dashboard interface, In Progress",
      })
    ).toBeTruthy();
    expect(
      within(myTasksPage).getByRole("article", {
        name: "Develop task components, In Progress",
      })
    ).toBeTruthy();
    expect(within(myTasksPage).getByText("Showing 2 of 10 tasks")).toBeTruthy();

    await user.selectOptions(priorityFilter, "Low");
    expect(
      within(myTasksPage).getByRole("heading", {
        name: "No tasks match these filters",
      })
    ).toBeTruthy();
    expect(within(myTasksPage).getByText("Showing 0 of 10 tasks")).toBeTruthy();

    await user.click(
      within(myTasksPage).getByRole("button", { name: "Clear Filters" })
    );
    expect(statusFilter.value).toBe("all");
    expect(priorityFilter.value).toBe("all");
    expect(within(myTasksPage).getAllByRole("article")).toHaveLength(10);
  });

  it("searches task titles, descriptions, and labels with filters and updates live", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("link", { name: /My Tasks/ }));

    const myTasksPage = screen.getByRole("region", { name: "My Tasks" });
    const search = screen.getByRole("searchbox", { name: "Search tasks" });
    const statusFilter = within(myTasksPage).getByLabelText("Status");
    const priorityFilter = within(myTasksPage).getByLabelText("Priority");

    await user.type(search, "dEsIgN lAnDiNg");
    expect(within(myTasksPage).getAllByRole("article")).toHaveLength(1);
    expect(
      within(myTasksPage).getByRole("article", {
        name: "Design landing page, To Do",
      })
    ).toBeTruthy();
    expect(within(myTasksPage).getByText("Showing 1 of 10 tasks")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Clear task search" }));
    expect(search.value).toBe("");
    expect(within(myTasksPage).getAllByRole("article")).toHaveLength(10);

    await user.type(search, "development");
    expect(within(myTasksPage).getAllByRole("article")).toHaveLength(2);
    expect(
      within(myTasksPage).getByRole("article", {
        name: "Configure Vite, Done",
      })
    ).toBeTruthy();

    await user.clear(search);
    await user.selectOptions(statusFilter, "todo");
    await user.selectOptions(priorityFilter, "High");
    await user.type(search, "design");
    expect(within(myTasksPage).getAllByRole("article")).toHaveLength(1);

    await user.clear(search);
    await user.type(search, "no matching task");
    await user.click(screen.getByRole("button", { name: "Add Task" }));
    await user.type(screen.getByLabelText("Task Title *"), "Keyword container");
    await user.type(
      screen.getByLabelText("Description"),
      "Distinctive searchable description"
    );
    await user.click(screen.getByRole("button", { name: "Create Task" }));
    expect(
      within(myTasksPage).getByRole("heading", {
        name: "No tasks match your search",
      })
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Clear Filters" }));
    await user.type(search, "DISTINCTIVE SEARCHABLE DESCRIPTION");
    expect(
      within(myTasksPage).getByRole("article", {
        name: "Keyword container, To Do",
      })
    ).toBeTruthy();
    expect(within(myTasksPage).getByText("Showing 1 of 11 tasks")).toBeTruthy();
  });

  it("shows an empty state when all shared task columns are empty", async () => {
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

    await user.click(screen.getByRole("link", { name: /My Tasks/ }));

    const myTasksPage = screen.getByRole("region", { name: "My Tasks" });
    expect(within(myTasksPage).getByRole("heading", { name: "No tasks yet" })).toBeTruthy();
    expect(
      within(myTasksPage).getByRole("group", { name: "Total Tasks" }).textContent
    ).toContain("0");
    expect(within(myTasksPage).queryByRole("article")).toBeNull();
  });

  it("assigns missing due dates by status and displays tasks on their saved dates", async () => {
    const user = userEvent.setup();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const firstDueDate = `${year}-${month}-15`;
    const updatedDueDate = `${year}-${month}-16`;
    const dateLabel = (day) =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(year, now.getMonth(), day));
    const userCreateTask = async (title, dueDate) => {
      await user.click(screen.getByRole("button", { name: /add task/i }));
      await user.type(screen.getByLabelText("Task Title *"), title);
      if (dueDate) {
        fireEvent.change(screen.getByLabelText(/Due date/), {
          target: { value: dueDate },
        });
      }
      await user.click(screen.getByRole("button", { name: "Create Task" }));
    };

    const { unmount } = render(<App />);
    await userCreateTask("Due task one", firstDueDate);
    await userCreateTask("Due task two", firstDueDate);
    await userCreateTask("Due task three", firstDueDate);
    await userCreateTask("Automatically dated task", "");
    await user.click(screen.getByRole("link", { name: /Calendar/ }));

    const calendarTable = screen.getByRole("table", {
      name: `${new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric",
      }).format(now)} calendar`,
    });
    const firstDateCell = within(calendarTable).getByRole("cell", {
      name: dateLabel(15),
    });
    expect(within(firstDateCell).getByText("Due task one")).toBeTruthy();
    expect(within(firstDateCell).getByText("Due task two")).toBeTruthy();
    expect(within(firstDateCell).queryByText("Due task three")).toBeNull();
    const showMoreButton = within(firstDateCell).getByRole("button", {
      name: `Show 1 more task for ${dateLabel(15)}`,
    });
    expect(showMoreButton.getAttribute("aria-expanded")).toBe("false");
    expect(
      firstDateCell.querySelector(".calendar-task--todo .calendar-task-priority--medium")
    ).toBeTruthy();

    await user.click(showMoreButton);
    let selectedDayPanel = screen.getByRole("region", {
      name: `Tasks for ${dateLabel(15)}`,
    });
    expect(showMoreButton.getAttribute("aria-expanded")).toBe("true");
    expect(within(selectedDayPanel).getByText("Due task three")).toBeTruthy();
    await user.click(
      within(selectedDayPanel).getByRole("button", {
        name: "Close selected date",
      })
    );

    await user.click(
      within(firstDateCell).getByRole("button", {
        name: new RegExp(`Select ${dateLabel(15)}`),
      })
    );
    selectedDayPanel = screen.getByRole("region", {
      name: `Tasks for ${dateLabel(15)}`,
    });
    expect(within(selectedDayPanel).getByText("Due task one")).toBeTruthy();
    expect(within(selectedDayPanel).getByText("Due task two")).toBeTruthy();
    expect(within(selectedDayPanel).getByText("Due task three")).toBeTruthy();
    const storedColumnsBeforeEdit = JSON.parse(
      localStorage.getItem("taskflow-team-board.columns")
    );
    const allStoredTasks = storedColumnsBeforeEdit.flatMap(
      (column) => column.tasks
    );
    expect(allStoredTasks.every((task) => /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate))).toBe(
      true
    );

    const getIsoDate = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const expectedInProgressDate = getIsoDate(now);
    const yesterday = new Date(year, now.getMonth(), now.getDate() - 1);
    const expectedDoneDate = getIsoDate(yesterday);
    const todoTomorrow = new Date(year, now.getMonth(), now.getDate() + 1);
    expect(
      allStoredTasks.find((task) => task.title === "Build dashboard interface")
        .dueDate
    ).toBe(expectedInProgressDate);
    expect(
      allStoredTasks.find((task) => task.title === "Set up React project").dueDate
    ).toBe(expectedDoneDate);
    expect(
      allStoredTasks.find((task) => task.title === "Design landing page").dueDate
    ).toBe(getIsoDate(todoTomorrow));

    const automaticallyDatedTask = allStoredTasks.find(
      (task) => task.title === "Automatically dated task"
    );
    const automaticallyDatedDate = new Date(
      `${automaticallyDatedTask.dueDate}T12:00:00`
    );
    const autoDateCell = within(calendarTable).getByRole("cell", {
      name: new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(automaticallyDatedDate),
    });
    expect(
      within(autoDateCell).getByText("Automatically dated task")
    ).toBeTruthy();

    await user.click(screen.getByRole("link", { name: /Dashboard/ }));
    await user.click(
      screen.getByRole("button", { name: "Edit Due task one" })
    );
    fireEvent.change(screen.getByLabelText(/Due date/), {
      target: { value: updatedDueDate },
    });
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    const savedColumns = JSON.parse(
      localStorage.getItem("taskflow-team-board.columns")
    );
    const updatedTask = savedColumns
      .flatMap((column) => column.tasks)
      .find((task) => task.title === "Due task one");
    expect(updatedTask.dueDate).toBe(updatedDueDate);

    await user.click(screen.getByRole("link", { name: /Calendar/ }));
    const updatedCell = within(
      screen.getByRole("table", {
        name: `${new Intl.DateTimeFormat(undefined, {
          month: "long",
          year: "numeric",
        }).format(now)} calendar`,
      })
    ).getByRole("cell", { name: dateLabel(16) });
    expect(within(updatedCell).getByText("Due task one")).toBeTruthy();

    const oldCell = within(
      screen.getByRole("table", {
        name: `${new Intl.DateTimeFormat(undefined, {
          month: "long",
          year: "numeric",
        }).format(now)} calendar`,
      })
    ).getByRole("cell", { name: dateLabel(15) });
    expect(within(oldCell).queryByText("Due task one")).toBeNull();

    unmount();
    render(<App />);
    await user.click(screen.getByRole("link", { name: /Calendar/ }));
    const restoredDateCell = within(
      screen.getByRole("table", {
        name: `${new Intl.DateTimeFormat(undefined, {
          month: "long",
          year: "numeric",
        }).format(now)} calendar`,
      })
    ).getByRole("cell", { name: dateLabel(16) });
    expect(within(restoredDateCell).getByText("Due task one")).toBeTruthy();
  });

  it("opens calendar task details, reuses edit, and closes accessibly", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: /Calendar/ }));

    await user.click(
      screen.getByRole("button", {
        name: /Design landing page, To Do, High priority.*View task details/,
      })
    );

    let details = screen.getByRole("dialog", {
      name: "Design landing page",
    });
    expect(within(details).getByText("To Do")).toBeTruthy();
    expect(within(details).getByText("High")).toBeTruthy();
    expect(within(details).getByText("Design")).toBeTruthy();
    expect(
      within(details).getByText("No description provided.")
    ).toBeTruthy();
    expect(within(details).getByText("Due date").parentElement.textContent).not
      .toContain("No due date");

    await user.click(
      within(details).getByRole("button", { name: "Edit Task" })
    );
    const editDialog = screen.getByRole("dialog", { name: "Edit Task" });
    const titleInput = within(editDialog).getByLabelText("Task Title *");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated from Calendar");
    await user.click(
      within(editDialog).getByRole("button", { name: "Save Changes" })
    );

    details = screen.getByRole("dialog", {
      name: "Updated from Calendar",
    });
    expect(within(details).getByText("To Do")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: "Updated from Calendar" })
    ).toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: /Updated from Calendar, To Do, High priority.*View task details/,
      })
    );
    fireEvent.mouseDown(
      screen.getByRole("dialog", { name: "Updated from Calendar" })
        .parentElement
    );
    expect(
      screen.queryByRole("dialog", { name: "Updated from Calendar" })
    ).toBeNull();
  });

  it("moves today's highlight when the local date changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 30, 23, 59, 30));
    render(<App />);
    fireEvent.click(screen.getByRole("link", { name: /Calendar/ }));

    const calendarTable = () =>
      screen.getByRole("table", { name: "November 2026 calendar" });
    const highlightedDate = () =>
      within(calendarTable())
        .getAllByRole("cell")
        .find((cell) => cell.getAttribute("aria-current") === "date");
    expect(highlightedDate().querySelector("time").dateTime).toBe("2026-11-30");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(highlightedDate().querySelector("time").dateTime).toBe("2026-12-01");
  });

  it("restores manual themes after refresh and keeps them across navigation", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App />);
    await user.click(screen.getByRole("link", { name: /Settings/ }));
    await user.click(screen.getByRole("button", { name: /Dark Mode/ }));

    expect(
      firstRender.container.querySelector(".app-layout").dataset.theme
    ).toBe("dark");
    expect(localStorage.getItem("taskflow-team-board.theme")).toBe("dark");

    const sidebarPages = [
      /Dashboard/,
      /My Tasks/,
      /Calendar/,
      /Help/,
      /Your Progress/,
      /Settings/,
    ];
    for (const pageName of sidebarPages) {
      await user.click(screen.getByRole("link", { name: pageName }));
      expect(
        firstRender.container.querySelector(".app-layout").dataset.theme
      ).toBe("dark");
    }

    firstRender.unmount();
    const darkRefresh = render(<App />);
    expect(
      darkRefresh.container.querySelector(".app-layout").dataset.theme
    ).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(screen.getByRole("link", { name: /Settings/ }));
    await user.click(screen.getByRole("button", { name: /Light Mode/ }));
    expect(localStorage.getItem("taskflow-team-board.theme")).toBe("light");
    darkRefresh.unmount();

    const lightRefresh = render(<App />);
    expect(
      lightRefresh.container.querySelector(".app-layout").dataset.theme
    ).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("falls back to the device theme when the stored theme is invalid", () => {
    localStorage.setItem("taskflow-team-board.theme", "violet");
    originalWindowMatchMedia = window.matchMedia;
    const mediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));
    window.matchMedia = vi.fn(() => mediaQuery);

    const { container } = render(<App />);

    expect(container.querySelector(".app-layout").dataset.theme).toBe("dark");
    expect(localStorage.getItem("taskflow-team-board.theme")).toBeNull();
  });

  it("applies and restores application preferences", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<App />);
    await user.click(screen.getByRole("link", { name: /Settings/ }));

    const preferencesSection = screen.getByRole("region", {
      name: "Application Preferences",
    });
    const compactTaskCards = within(preferencesSection).getByRole("checkbox", {
      name: "Compact task cards",
    });

    expect(compactTaskCards.checked).toBe(false);
    await user.click(within(preferencesSection).getByText("Compact task cards"));
    expect(compactTaskCards.checked).toBe(true);
    expect(container.querySelector(".app-layout").dataset.taskDensity).toBe(
      "compact"
    );

    await user.click(
      within(preferencesSection).getByRole("radio", {
        name: /Always reduce motion/,
      })
    );
    expect(
      container.querySelector(".app-layout").dataset.motionPreference
    ).toBe("reduced");
    expect(document.documentElement.dataset.appMotion).toBe("reduced");
    expect(
      JSON.parse(
        localStorage.getItem("taskflow-team-board.application-preferences")
      )
    ).toEqual({
      compactTaskCards: true,
      motionPreference: "reduced",
    });

    unmount();
    expect(document.documentElement.dataset.appMotion).toBeUndefined();
    const { container: restoredContainer } = render(<App />);
    await user.click(screen.getByRole("link", { name: /Settings/ }));
    expect(
      restoredContainer.querySelector(".app-layout").dataset.taskDensity
    ).toBe("compact");
    expect(
      restoredContainer.querySelector(".app-layout").dataset.motionPreference
    ).toBe("reduced");
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
      screen.getByText(/Use the Search tasks field in the top navigation/i)
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

  it("validates, saves, and restores profile information", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<App />);
    await user.click(screen.getByRole("link", { name: /Settings/ }));

    let profileSection = screen.getByRole("region", {
      name: "Profile Information",
    });
    expect(
      within(profileSection).getByRole("heading", { name: "Weynshet" })
    ).toBeTruthy();
    expect(within(profileSection).getByText("Email not provided")).toBeTruthy();
    expect(
      within(profileSection).getByRole("img", {
        name: "WK profile initials",
      })
    ).toBeTruthy();

    await user.click(
      within(profileSection).getByRole("button", { name: "Edit Profile" })
    );
    await user.clear(screen.getByLabelText(/Full Name/));
    await user.type(screen.getByLabelText(/Email Address/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    const validationAlert = screen.getByRole("alert");
    expect(validationAlert.textContent).toContain("Enter your full name.");
    expect(validationAlert.textContent).toContain("Enter a valid email address");
    expect(localStorage.getItem("taskflow-team-board.profile")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    profileSection = screen.getByRole("region", {
      name: "Profile Information",
    });
    expect(
      within(profileSection).getByRole("heading", { name: "Weynshet" })
    ).toBeTruthy();

    await user.click(
      within(profileSection).getByRole("button", { name: "Edit Profile" })
    );
    await user.clear(screen.getByLabelText(/Full Name/));
    await user.type(screen.getByLabelText(/Full Name/), "Ada Lovelace");
    await user.type(screen.getByLabelText(/Email Address/), "ada@example.com");
    await user.clear(screen.getByLabelText(/Avatar Initials/));
    await user.type(screen.getByLabelText(/Avatar Initials/), "AL");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    profileSection = screen.getByRole("region", {
      name: "Profile Information",
    });
    expect(
      within(profileSection).getByRole("heading", { name: "Ada Lovelace" })
    ).toBeTruthy();
    expect(
      within(profileSection).getByText("ada@example.com")
    ).toBeTruthy();
    expect(container.querySelector(".sidebar-profile")).toBeNull();
    expect(
      container.querySelector(".header-profile .profile-avatar").textContent
    ).toContain("AL");
    expect(
      JSON.parse(localStorage.getItem("taskflow-team-board.profile"))
    ).toMatchObject({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      initials: "AL",
    });

    unmount();
    render(<App />);
    await user.click(screen.getByRole("link", { name: /Settings/ }));
    profileSection = screen.getByRole("region", {
      name: "Profile Information",
    });
    expect(
      within(profileSection).getByRole("heading", { name: "Ada Lovelace" })
    ).toBeTruthy();
  });
});
