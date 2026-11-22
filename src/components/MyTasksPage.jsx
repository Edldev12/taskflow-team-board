import { useMemo } from "react";
import { CalendarDays, Inbox, ListTodo } from "lucide-react";
import { isValidDueDate } from "../utils/taskDates";
import "./MyTasksPage.css";

const taskStatusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

function formatDueDate(dueDate) {
  if (!isValidDueDate(dueDate)) return "";

  const [year, month, day] = dueDate.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(new Date(year, month - 1, day));
}

function MyTasksPage({
  columns,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  createButtonRef,
}) {
  const tasks = useMemo(
    () =>
      columns.flatMap((column) =>
        column.tasks.map((task) => ({
          task,
          status: column.title || taskStatusLabels[column.id] || "Unknown",
          statusId: column.id,
        }))
      ),
    [columns]
  );

  return (
    <section
      className="dashboard-content my-tasks-content"
      aria-labelledby="my-tasks-heading"
    >
      <div className="dashboard-heading">
        <div>
          <h1 id="my-tasks-heading">My Tasks</h1>
          <p>All of your tasks, organized in one place.</p>
        </div>

        <div className="my-tasks-heading-actions">
          <div
            className="my-tasks-total-card"
            role="group"
            aria-label="Total Tasks"
          >
            <span className="my-tasks-total-icon" aria-hidden="true">
              <ListTodo size={22} strokeWidth={1.8} />
            </span>
            <span>
              <span className="my-tasks-total-label">Total Tasks</span>
              <strong>{tasks.length}</strong>
            </span>
          </div>
          <button
            ref={createButtonRef}
            className="add-task-button"
            onClick={onCreateTask}
            type="button"
          >
            <span aria-hidden="true">+</span> Add Task
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="my-tasks-empty-state">
          <span className="my-tasks-empty-icon" aria-hidden="true">
            <Inbox size={28} strokeWidth={1.7} />
          </span>
          <h2>No tasks yet</h2>
          <p>Create a task to see it here.</p>
        </div>
      ) : (
        <div className="my-task-grid">
          {tasks.map(({ task, status, statusId }) => {
            const priority = task.priority || "Priority not set";
            const priorityClass = task.priority?.toLowerCase();
            const dueDate = isValidDueDate(task.dueDate)
              ? formatDueDate(task.dueDate)
              : "";

            return (
              <article
                className="my-task-card"
                key={task.id}
                aria-label={`${task.title}, ${status}`}
              >
                <div className="my-task-card-heading">
                  <h2>{task.title}</h2>
                  <span
                    className={`my-task-status my-task-status--${statusId}`}
                  >
                    {status}
                  </span>
                </div>

                <p className="my-task-description">
                  {task.description || "No description provided."}
                </p>

                <div className="my-task-tags">
                  <span className="task-label">{task.label || "No label"}</span>
                  <span
                    className={`priority${
                      priorityClass ? ` ${priorityClass}` : ""
                    }`}
                  >
                    {priority}
                  </span>
                </div>

                {dueDate && (
                  <div className="my-task-due-date">
                    <CalendarDays size={15} aria-hidden="true" />
                    <time dateTime={task.dueDate}>Due {dueDate}</time>
                  </div>
                )}

                <div className="task-card-actions my-task-actions">
                  <button
                    type="button"
                    className="task-edit-button"
                    onClick={(event) =>
                      onEditTask(task, event.currentTarget)
                    }
                    aria-label={`Edit ${task.title}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="task-delete-button"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MyTasksPage;
