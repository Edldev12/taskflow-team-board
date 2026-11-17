
function TaskCard({ task }) {
  return (
    <article className="task-card">
      <h3>{task.title}</h3>

      <div className="task-card-footer">
        <span className="task-label">{task.label}</span>
        <span className={`priority ${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
      </div>
    </article>
  );
}

export default TaskCard;
