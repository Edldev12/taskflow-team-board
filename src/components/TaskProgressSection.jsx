import { CircleCheck, Clock3, ListTodo } from "lucide-react";
import TaskStatsCard from "./TaskStatsCard";

function TaskProgressSection({
  totalTasks,
  completedTasks,
  pendingTasks,
  completionPercentage,
}) {
  return (
    <section
      className="task-progress-section"
      aria-labelledby="task-progress-title"
    >
      <div className="task-progress-heading">
        <div>
          <h2 id="task-progress-title">Project Progress</h2>
          <p>Overall task completion</p>
        </div>
        <strong className="task-progress-percentage">
          {completionPercentage}%
        </strong>
      </div>

      <div
        className="task-progress-track"
        role="progressbar"
        aria-label="Overall project completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completionPercentage}
        aria-valuetext={`${completionPercentage}% complete`}
      >
        <span
          className="task-progress-fill"
          style={{ width: `${completionPercentage}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="task-stats-grid" aria-label="Task summary">
        <TaskStatsCard label="Total Tasks" count={totalTasks} icon={ListTodo} />
        <TaskStatsCard
          label="Completed Tasks"
          count={completedTasks}
          icon={CircleCheck}
          variant="completed"
        />
        <TaskStatsCard
          label="Pending Tasks"
          count={pendingTasks}
          icon={Clock3}
          variant="pending"
        />
      </div>
    </section>
  );
}

export default TaskProgressSection;
