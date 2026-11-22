import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./CalendarPage.css";

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

function CalendarPage() {
  const [displayedMonth, setDisplayedMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const headingRef = useRef(null);
  const monthLabel = getMonthLabel(displayedMonth);
  const today = new Date();
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

  useEffect(() => {
    headingRef.current?.focus();
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

  return (
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
            className="calendar-table"
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
                      const isToday =
                        date.getFullYear() === today.getFullYear() &&
                        date.getMonth() === today.getMonth() &&
                        date.getDate() === today.getDate();
                      const accessibleDate = new Intl.DateTimeFormat(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }).format(date);

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
  );
}

export default CalendarPage;
