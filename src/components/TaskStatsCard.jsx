import { ListTodo } from "lucide-react";

function TaskStatsCard({ totalTasks }) {
  return (
    <section className="task-stats-card" role="group" aria-label="Total tasks">
      <div className="task-stats-icon" aria-hidden="true">
        <ListTodo size={23} strokeWidth={1.8} />
      </div>
      <div>
        <p>Total Tasks</p>
        <strong>{totalTasks}</strong>
      </div>
    </section>
  );
}

export default TaskStatsCard;
