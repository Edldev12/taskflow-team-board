import { useMemo, useState } from "react";
import { Inbox, ListTodo } from "lucide-react";
import TaskCard from "./TaskCard";
import "./MyTasksPage.css";

const taskStatusLabels = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
};

const taskPriorities = ["Low", "Medium", "High"];

function MyTasksPage({
  columns,
  searchQuery,
  onSearchQueryChange,
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredTasks = useMemo(
    () => {
      if (
        statusFilter === "all" &&
        priorityFilter === "all" &&
        !normalizedSearchQuery
      ) {
        return tasks;
      }

      return tasks.filter(({ task, statusId }) => {
        if (statusFilter !== "all" && statusId !== statusFilter) return false;
        if (priorityFilter !== "all" && task.priority !== priorityFilter) {
          return false;
        }
        if (!normalizedSearchQuery) return true;

        const searchableText = [
          task.title,
          task.description,
          task.label,
        ].filter((value) => typeof value === "string");

        return searchableText.some((value) =>
          value.toLowerCase().includes(normalizedSearchQuery)
        );
      });
    },
    [normalizedSearchQuery, priorityFilter, statusFilter, tasks]
  );
  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    normalizedSearchQuery !== "";

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
        <>
          <div className="my-task-filter-toolbar">
            <div
              className="my-task-filter-fields"
              role="group"
              aria-label="Task filters"
            >
              <label
                className="my-task-filter-field"
                htmlFor="my-tasks-status-filter"
              >
                <span>Status</span>
                <select
                  id="my-tasks-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className="my-task-filter-field"
                htmlFor="my-tasks-priority-filter"
              >
                <span>Priority</span>
                <select
                  id="my-tasks-priority-filter"
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                >
                  <option value="all">All Priorities</option>
                  {taskPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="my-task-filter-summary">
              <p
                className="my-task-results-count"
                role="status"
                aria-live="polite"
              >
                Showing {filteredTasks.length} of {tasks.length}{" "}
                {tasks.length === 1 ? "task" : "tasks"}
              </p>
              <button
                className="my-task-clear-filters"
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  onSearchQueryChange("");
                }}
                disabled={!hasActiveFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="my-tasks-no-results">
              <h2>
                {normalizedSearchQuery
                  ? "No tasks match your search"
                  : "No tasks match these filters"}
              </h2>
              <p>
                {normalizedSearchQuery
                  ? `No tasks match “${searchQuery.trim()}”${
                      statusFilter !== "all" || priorityFilter !== "all"
                        ? " with the selected filters."
                        : ". Try a different search."
                    }`
                  : "Change your filters or clear them to see all tasks."}
              </p>
            </div>
          ) : (
            <div className="my-task-grid">
              {filteredTasks.map(({ task, status, statusId }) => {
                return (
                  <TaskCard
                    variant="my-tasks"
                    task={task}
                    columnTitle={status}
                    statusId={statusId}
                    key={task.id}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default MyTasksPage;
