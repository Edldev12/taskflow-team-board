import { ListTodo } from "lucide-react";

function TaskStatsCard({
  label,
  count,
  icon: Icon = ListTodo,
  variant,
  progress,
}) {
  return (
    <section
      className={`task-stats-card${variant ? ` task-stats-card--${variant}` : ""}${
        progress !== undefined ? " task-stats-card--with-progress" : ""
      }`}
      role="group"
      aria-label={label}
    >
      <div className="task-stats-icon" aria-hidden="true">
        <Icon size={23} strokeWidth={1.8} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{count}</strong>
      </div>
      {progress !== undefined && (
        <div
          className="task-stats-progress"
          role="progressbar"
          aria-label="Task completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
    </section>
  );
}

export default TaskStatsCard;
