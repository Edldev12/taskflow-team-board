
function TaskCard({
  task,
  columnTitle,
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
  return (
    <article
      ref={cardRef}
      className={`task-card${isDragging ? " is-dragging" : ""}${
        isKeyboardMoving ? " is-keyboard-moving" : ""
      }${
        dropPosition ? ` drop-${dropPosition}` : ""
      }`}
      tabIndex={0}
      aria-label={`${task.title}, ${columnTitle}. Press Enter or Space to move.`}
      aria-describedby="task-keyboard-help"
      aria-keyshortcuts="Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight Escape"
      draggable="true"
      onDragStart={(event) => onDragStart(task.id, event)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
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
