import { useEffect, useLayoutEffect, useRef } from "react";
import { CalendarDays, Pencil, X } from "lucide-react";
import { isValidDueDate } from "../utils/taskDates";
import "./CalendarTaskDetails.css";

const taskStatusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

function formatDueDate(dueDate) {
  if (!isValidDueDate(dueDate)) return "No due date";

  const [year, month, day] = dueDate.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(new Date(year, month - 1, day));
}

function CalendarTaskDetails({
  task,
  onClose,
  onEdit,
  isEditModalOpen,
  fallbackFocusRef,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const isEditModalOpenRef = useRef(isEditModalOpen);

  const status = task.status || "todo";
  const statusLabel = taskStatusLabels[status] || "To Do";
  const priorityClass = task.priority.toLowerCase();

  useLayoutEffect(() => {
    isEditModalOpenRef.current = isEditModalOpen;
  }, [isEditModalOpen]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const fallbackFocusTarget = fallbackFocusRef.current;
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (isEditModalOpenRef.current) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      } else {
        fallbackFocusTarget?.focus();
      }
    };
  }, [fallbackFocusRef, onClose]);

  return (
    <div
      className="calendar-task-details-overlay"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isEditModalOpenRef.current
        ) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        className="calendar-task-details"
        role="dialog"
        aria-modal={isEditModalOpen ? undefined : "true"}
        aria-hidden={isEditModalOpen ? "true" : undefined}
        aria-labelledby="calendar-task-details-title"
      >
        <header className="calendar-task-details-header">
          <h2 id="calendar-task-details-title">{task.title}</h2>
          <button
            ref={closeButtonRef}
            className="calendar-task-details-close"
            type="button"
            aria-label="Close task details"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="calendar-task-details-badges">
          <span
            className={`calendar-task-status calendar-task-status--${status}`}
          >
            {statusLabel}
          </span>
          <span className={`priority ${priorityClass}`}>{task.priority}</span>
        </div>

        <dl className="calendar-task-details-fields">
          <div>
            <dt>Due date</dt>
            <dd>
              <CalendarDays size={16} aria-hidden="true" />
              {formatDueDate(task.dueDate)}
            </dd>
          </div>
          <div>
            <dt>Label</dt>
            <dd>
              {task.label ? (
                <span className="task-label">{task.label}</span>
              ) : (
                "No label"
              )}
            </dd>
          </div>
          <div className="calendar-task-details-description">
            <dt>Description</dt>
            <dd>{task.description || "No description provided."}</dd>
          </div>
        </dl>

        <footer className="calendar-task-details-actions">
          <button
            className="calendar-task-details-edit"
            type="button"
            onClick={(event) => onEdit(task, event.currentTarget)}
          >
            <Pencil size={16} aria-hidden="true" />
            Edit Task
          </button>
        </footer>
      </section>
    </div>
  );
}

export default CalendarTaskDetails;
