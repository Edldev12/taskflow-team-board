import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CalendarTaskDetails from "./CalendarTaskDetails";
import { isValidDueDate } from "../utils/taskDates";
import "./CalendarPage.css";

const MAX_VISIBLE_TASKS_PER_DAY = 2;
const taskStatusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};
const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getMonthLabel(date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getDateTimeValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function CalendarPage({ columns, onEditTask, isEditModalOpen }) {
  const [displayedMonth, setDisplayedMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [todayDate, setTodayDate] = useState(() =>
    getDateTimeValue(new Date())
  );
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const headingRef = useRef(null);
  const monthLabel = getMonthLabel(displayedMonth);
  const dates = useMemo(() => {
    const firstOfMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth(),
      1
    );
    const firstVisibleDate = new Date(
      firstOfMonth.getFullYear(),
      firstOfMonth.getMonth(),
      1 - firstOfMonth.getDay()
    );

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(firstVisibleDate);
      date.setDate(firstVisibleDate.getDate() + index);
      return date;
    });
  }, [displayedMonth]);
  const tasksByDueDate = useMemo(() => {
    const tasks = new Map();

    for (const column of columns) {
      for (const task of column.tasks) {
        if (!isValidDueDate(task.dueDate)) continue;

        const dueDateTasks = tasks.get(task.dueDate) || [];
        dueDateTasks.push(task);
        tasks.set(task.dueDate, dueDateTasks);
      }
    }

    return tasks;
  }, [columns]);
  const hasVisibleDueTasks = dates.some((date) =>
    tasksByDueDate.has(getDateTimeValue(date))
  );
  const selectedTask =
    selectedTaskId === null
      ? null
      : columns
        .flatMap((column) => column.tasks)
        .find((task) => String(task.id) === String(selectedTaskId)) || null;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    function updateTodayDate() {
      const currentDate = getDateTimeValue(new Date());
      setTodayDate((previousDate) =>
        previousDate === currentDate ? previousDate : currentDate
      );
    }

    const intervalId = window.setInterval(updateTodayDate, 60_000);
    window.addEventListener("focus", updateTodayDate);
    document.addEventListener("visibilitychange", updateTodayDate);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", updateTodayDate);
      document.removeEventListener("visibilitychange", updateTodayDate);
    };
  }, []);

  function changeMonth(offset) {
    setDisplayedMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + offset,
          1
        )
    );
  }

  function goToToday() {
    const currentDate = new Date();
    setTodayDate(getDateTimeValue(currentDate));
    setDisplayedMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    );
  }

  const closeTaskDetails = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  return (
    <>
    <section
      className="dashboard-content calendar-page"
      aria-labelledby="calendar-page-title"
    >
      <header className="dashboard-heading">
        <div>
          <h1 id="calendar-page-title" ref={headingRef} tabIndex="-1">
            Calendar
          </h1>
          <p>View dates across the month.</p>
        </div>
      </header>

      <section
        className="monthly-calendar"
        aria-label={`Calendar for ${monthLabel}`}
      >
        <div className="calendar-toolbar">
          <h2 aria-live="polite">{monthLabel}</h2>
          <div className="calendar-month-controls" aria-label="Change month">
            <button
              type="button"
              className="calendar-month-button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="calendar-today-button"
              onClick={goToToday}
            >
              Today
            </button>
            <button
              type="button"
              className="calendar-month-button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="calendar-table-wrapper">
          <table
            className={`calendar-table${hasVisibleDueTasks ? " has-due-tasks" : ""}`}
            aria-label={`${monthLabel} calendar`}
          >
            <thead>
              <tr>
                {weekdays.map((weekday) => (
                  <th scope="col" aria-label={weekday} key={weekday}>
                    <span className="calendar-weekday-full">{weekday}</span>
                    <span className="calendar-weekday-short" aria-hidden="true">
                      {weekday.slice(0, 3)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }, (_, weekIndex) => (
                <tr key={weekIndex}>
                  {dates
                    .slice(weekIndex * 7, weekIndex * 7 + 7)
                    .map((date) => {
                      const isCurrentMonth =
                        date.getMonth() === displayedMonth.getMonth();
                      const dateTimeValue = getDateTimeValue(date);
                      const isToday = dateTimeValue === todayDate;
                      const accessibleDate = new Intl.DateTimeFormat(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }).format(date);
                      const dueDateTasks = tasksByDueDate.get(dateTimeValue) || [];
                      const visibleTasks = dueDateTasks.slice(
                        0,
                        MAX_VISIBLE_TASKS_PER_DAY
                      );
                      const remainingTasks = dueDateTasks.slice(
                        MAX_VISIBLE_TASKS_PER_DAY
                      );

                      return (
                        <td
                          className={[
                            "calendar-day",
                            isCurrentMonth ? "" : "is-outside-month",
                            isToday ? "is-today" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-label={accessibleDate}
                          aria-current={isToday ? "date" : undefined}
                          key={getDateTimeValue(date)}
                        >
                          <time dateTime={getDateTimeValue(date)}>
                            {date.getDate()}
                          </time>
                          {dueDateTasks.length > 0 && (
                            <ul
                              className="calendar-task-list"
                              aria-label={`Tasks due ${accessibleDate}`}
                            >
                              {visibleTasks.map((task) => {
                                const status = task.status || "todo";
                                const priority = task.priority.toLowerCase();
                                const statusLabel =
                                  taskStatusLabels[status] || "To Do";

                                return (
                                  <li key={task.id}>
                                    <button
                                      className={`calendar-task calendar-task--${status}`}
                                      type="button"
                                      aria-label={`${task.title}, ${statusLabel}, ${task.priority} priority, due ${dateTimeValue}. View task details`}
                                      aria-haspopup="dialog"
                                      onClick={() => setSelectedTaskId(task.id)}
                                      title={`${task.title} - ${statusLabel} - ${task.priority} priority`}
                                    >
                                      <span className="calendar-task-title">
                                        {task.title}
                                      </span>
                                      <span
                                        className={`calendar-task-priority calendar-task-priority--${priority}`}
                                        aria-hidden="true"
                                      />
                                    </button>
                                  </li>
                                );
                              })}
                              {remainingTasks.length > 0 && (
                                <li
                                  className="calendar-task-more"
                                  aria-label={`${
                                    remainingTasks.length
                                  } more tasks: ${remainingTasks
                                    .map((task) => task.title)
                                    .join(", ")}`}
                                  title={remainingTasks
                                    .map((task) => task.title)
                                    .join(", ")}
                                >
                                  + {remainingTasks.length} more
                                </li>
                              )}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
    {selectedTask && (
      <CalendarTaskDetails
        task={selectedTask}
        onClose={closeTaskDetails}
        onEdit={onEditTask}
        isEditModalOpen={isEditModalOpen}
        fallbackFocusRef={headingRef}
      />
    )}
    </>
  );
}

export default CalendarPage;
