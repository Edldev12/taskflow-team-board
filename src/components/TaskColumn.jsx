
import TaskCard from "./TaskCard";

function TaskColumn({
  column,
  onEdit,
  onDelete,
  draggedTaskId,
  dropIndicator,
  isDropTarget,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDragOver,
  onColumnDragOver,
  onColumnDragLeave,
  onTaskDrop,
}) {
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
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            isDragging={draggedTaskId === task.id}
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
          />
        ))}
      </div>
    </section>
  );
}

export default TaskColumn;
