import { ListTodo } from "lucide-react";

function TaskStatsCard({ label, count, icon: Icon = ListTodo, variant }) {
  return (
    <section
      className={`task-stats-card${variant ? ` task-stats-card--${variant}` : ""}`}
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
    </section>
  );
}

export default TaskStatsCard;
