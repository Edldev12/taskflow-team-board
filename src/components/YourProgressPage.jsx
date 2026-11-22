import { useEffect, useRef } from "react";
import { CircleCheck, Clock3, ListTodo, Percent } from "lucide-react";
import TaskProgressSection from "./TaskProgressSection";
import TaskStatsCard from "./TaskStatsCard";
import "./YourProgressPage.css";

function YourProgressPage({
  totalTasks,
  completedTasks,
  pendingTasks,
  completionPercentage,
}) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="dashboard-content your-progress-page"
      id="your-progress"
      aria-labelledby="your-progress-title"
    >
      <header className="dashboard-heading">
        <div>
          <h1 id="your-progress-title" ref={headingRef} tabIndex="-1">
            Your Progress
          </h1>
          <p>Track your task completion and workload at a glance.</p>
        </div>
      </header>

      <TaskProgressSection
        totalTasks={totalTasks}
        completedTasks={completedTasks}
        pendingTasks={pendingTasks}
        completionPercentage={completionPercentage}
      />

      <section
        className="task-overview-section"
        aria-labelledby="task-overview-title"
      >
        <header className="task-overview-heading">
          <div>
            <h2 id="task-overview-title">Task Overview</h2>
            <p>A summary of all tasks across your board.</p>
          </div>
        </header>

        <div className="task-overview-grid">
          <TaskStatsCard
            label="Total Tasks"
            count={totalTasks}
            icon={ListTodo}
          />
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
          <TaskStatsCard
            label="Overall Completion"
            count={`${completionPercentage}%`}
            icon={Percent}
          />
        </div>
      </section>
    </section>
  );
}

export default YourProgressPage;
