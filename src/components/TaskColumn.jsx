
import { Fragment } from "react";
import TaskCard from "./TaskCard";

function TaskColumn({
  column,
  searchQuery = "",
  onEdit,
  onDelete,
  isTaskActionDisabled = false,
  draggedTaskId,
  dropIndicator,
  keyboardMove,
  isDropTarget,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDragOver,
  onTaskKeyDown,
  onTaskCardRef,
  onColumnDragOver,
  onColumnDragLeave,
  onTaskDrop,
}) {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredTasks = column.tasks.filter((task) =>
    [task.title, task.description, task.label]
      .filter((value) => typeof value === "string")
      .some((value) => value.toLowerCase().includes(normalizedSearchQuery))
  );
  const isKeyboardDestination = keyboardMove?.columnId === column.id;
  const keyboardSourceTaskIndex = column.tasks.findIndex(
    (task) => String(task.id) === String(keyboardMove?.taskId)
  );
  const keyboardMarkerIndex = isKeyboardDestination
    ? keyboardMove.index +
    (keyboardMove.sourceColumnId === column.id &&
      keyboardSourceTaskIndex < keyboardMove.index
      ? 1
      : 0)
    : -1;

  return (
    <section
      className={`task-column${isDropTarget ? " is-drop-target" : ""}`}
      onDragOver={onColumnDragOver}
      onDragLeave={onColumnDragLeave}
      onDrop={onTaskDrop}
    >
      <div className="column-heading">
        <div className="column-title">
          <span className={`status-dot ${column.color}`}></span>
          <h2>{column.title}</h2>
        </div>

        <span className="task-count">{filteredTasks.length}</span>
      </div>

      <div className="column-tasks">
        {filteredTasks.map((task, index) => (
          <Fragment key={task.id}>
            {isKeyboardDestination &&
              !normalizedSearchQuery &&
              keyboardMarkerIndex === index && (
                <div className="keyboard-drop-indicator" aria-hidden="true" />
              )}
            <TaskCard
              task={task}
              columnTitle={column.title}
              onEdit={onEdit}
              onDelete={onDelete}
              isTaskActionDisabled={isTaskActionDisabled}
              isDragging={draggedTaskId === task.id}
              isKeyboardMoving={
                keyboardMove &&
                String(keyboardMove.taskId) === String(task.id)
              }
              dropPosition={
                dropIndicator?.columnId === column.id &&
                  dropIndicator.taskId === task.id
                  ? dropIndicator.position
                  : null
              }
              onDragStart={onTaskDragStart}
              onDragEnd={onTaskDragEnd}
              onDragOver={(event) => onTaskDragOver(task.id, event)}
              onDrop={(event) => onTaskDrop(event, task.id)}
              onKeyDown={(event) => onTaskKeyDown(task.id, event)}
              cardRef={(element) => {
                onTaskCardRef(task.id, element);
              }}
            />
          </Fragment>
        ))}
        {isKeyboardDestination &&
          !normalizedSearchQuery &&
          keyboardMarkerIndex === filteredTasks.length && (
            <div className="keyboard-drop-indicator" aria-hidden="true" />
          )}
      </div>
    </section>
  );
}

export default TaskColumn;
