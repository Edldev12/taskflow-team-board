import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import { isValidDueDate } from "../utils/taskDates";

function formatDueDate(dueDate) {
  if (!isValidDueDate(dueDate)) return "";

  const [year, month, day] = dueDate.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(new Date(year, month - 1, day));
}

function TaskCard({
  task,
  columnTitle,
  statusId,
  variant = "board",
  onEdit,
  onDelete,
  isDragging,
  isKeyboardMoving,
  dropPosition,
  cardRef,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onKeyDown,
}) {
  const isMyTasksCard = variant === "my-tasks";
  const TitleTag = isMyTasksCard ? "h2" : "h3";
  const dueDate = isMyTasksCard ? formatDueDate(task.dueDate) : "";
  const priority = isMyTasksCard
    ? task.priority || "Priority not set"
    : task.priority;
  const priorityClass = task.priority?.toLowerCase();

  return (
    <article
      ref={isMyTasksCard ? undefined : cardRef}
      className={
        isMyTasksCard
          ? "my-task-card"
          : `task-card${isDragging ? " is-dragging" : ""}${
              isKeyboardMoving ? " is-keyboard-moving" : ""
            }${dropPosition ? ` drop-${dropPosition}` : ""}`
      }
      tabIndex={isMyTasksCard ? undefined : 0}
      aria-label={
        isMyTasksCard
          ? `${task.title}, ${columnTitle}`
          : `${task.title}, ${columnTitle}. Press Enter or Space to move.`
      }
      aria-describedby={isMyTasksCard ? undefined : "task-keyboard-help"}
      aria-keyshortcuts={
        isMyTasksCard
          ? undefined
          : "Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight Escape"
      }
      draggable={!isMyTasksCard}
      onDragStart={
        isMyTasksCard ? undefined : (event) => onDragStart(task.id, event)
      }
      onDragEnd={isMyTasksCard ? undefined : onDragEnd}
      onDragOver={isMyTasksCard ? undefined : onDragOver}
      onDrop={isMyTasksCard ? undefined : onDrop}
      onKeyDown={isMyTasksCard ? undefined : onKeyDown}
    >
      {isMyTasksCard ? (
        <div className="my-task-card-heading">
          <TitleTag>{task.title}</TitleTag>
          <span className={`my-task-status my-task-status--${statusId}`}>
            {columnTitle}
          </span>
        </div>
      ) : (
        <TitleTag>{task.title}</TitleTag>
      )}

      {task.description ? (
        <p className={isMyTasksCard ? "my-task-description" : "task-description"}>
          {task.description}
        </p>
      ) : (
        isMyTasksCard && (
          <p className="my-task-description">No description provided.</p>
        )
      )}

      <div
        className={`task-card-footer${isMyTasksCard ? " my-task-tags" : ""}`}
      >
        <span className="task-label">
          {isMyTasksCard ? task.label || "No label" : task.label}
        </span>
        <span className={`priority${priorityClass ? ` ${priorityClass}` : ""}`}>
          {priority}
        </span>
      </div>

      {dueDate && (
        <div className="my-task-due-date">
          <CalendarDays size={15} aria-hidden="true" />
          <time dateTime={task.dueDate}>Due {dueDate}</time>
        </div>
      )}

      <div className={`task-card-actions${isMyTasksCard ? " my-task-actions" : ""}`}>
        <button
          type="button"
          className="task-edit-button"
          onClick={(event) => onEdit(task, event.currentTarget)}
          aria-label={`Edit ${task.title}`}
        >
          <Pencil size={14} aria-hidden="true" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          className="task-delete-button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
        >
          <Trash2 size={14} aria-hidden="true" />
          <span>Delete</span>
        </button>
      </div>
    </article>
  );
}

export default TaskCard;
