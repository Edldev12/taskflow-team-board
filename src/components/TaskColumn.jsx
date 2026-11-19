
import { Fragment } from "react";
import TaskCard from "./TaskCard";

function TaskColumn({
  column,
  onEdit,
  onDelete,
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

        <span className="task-count">{column.tasks.length}</span>
      </div>

      <div className="column-tasks">
        {column.tasks.map((task, index) => (
          <Fragment key={task.id}>
            {isKeyboardDestination && keyboardMarkerIndex === index && (
              <div className="keyboard-drop-indicator" aria-hidden="true" />
            )}
            <TaskCard
              task={task}
              columnTitle={column.title}
              onEdit={onEdit}
              onDelete={onDelete}
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
          keyboardMarkerIndex === column.tasks.length && (
            <div className="keyboard-drop-indicator" aria-hidden="true" />
          )}
      </div>
    </section>
  );
}

export default TaskColumn;
