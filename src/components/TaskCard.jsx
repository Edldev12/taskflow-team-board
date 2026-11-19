
function TaskCard({ task, onEdit, onDelete, isDragging, onDragStart, onDragEnd }) {
  return (
    <article
      className={`task-card${isDragging ? " is-dragging" : ""}`}
      draggable="true"
      onDragStart={(event) => onDragStart(task.id, event)}
      onDragEnd={onDragEnd}
    >
      <h3>{task.title}</h3>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-card-footer">
        <span className="task-label">{task.label}</span>
        <span className={`priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>

      <div className="task-card-actions">
        <button
          type="button"
          className="task-edit-button"
          onClick={(event) => onEdit(task, event.currentTarget)}
          aria-label={`Edit ${task.title}`}
        >
          Edit
        </button>

        <button
          type="button"
          className="task-delete-button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default TaskCard;
