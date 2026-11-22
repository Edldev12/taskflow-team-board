import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
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
    expect(
      container.querySelector(".sidebar-profile-info strong").textContent
    ).toBe("Ada Lovelace");
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
