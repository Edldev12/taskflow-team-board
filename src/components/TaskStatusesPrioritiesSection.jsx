import { CircleCheck, Clock3, Flag, Lightbulb, ListTodo } from "lucide-react";
import "./TaskStatusesPrioritiesSection.css";

const taskStatuses = [
  {
    title: "To Do",
    icon: ListTodo,
    tone: "todo",
    description:
      "Use this for work that has been planned but has not started yet.",
  },
  {
    title: "In Progress",
    icon: Clock3,
    tone: "in-progress",
    description:
      "Move a task here when someone is actively working on it.",
  },
  {
    title: "Done",
    icon: CircleCheck,
    tone: "done",
    description:
      "Use this when all work on the task is complete.",
  },
];

const taskPriorities = [
  {
    title: "High",
    badge: "high",
    description: "Needs attention first or has an urgent deadline.",
  },
  {
    title: "Medium",
    badge: "medium",
    description: "Has normal importance and can follow higher-urgency work.",
  },
  {
    title: "Low",
    badge: "low",
    description: "Is not urgent and can wait until more important tasks are handled.",
  },
];

function TaskStatusesPrioritiesSection() {
  return (
    <section
      className="help-status-priority-section"
      aria-labelledby="task-statuses-priorities-title"
    >
      <header className="help-section-heading">
        <p className="help-eyebrow">ORGANIZE YOUR WORK</p>
        <h2 id="task-statuses-priorities-title">
          Task Statuses and Priorities
        </h2>
        <p>
          Status shows where work is in its process. Priority shows which work
          needs attention first.
        </p>
      </header>

      <section
        className="help-status-cards"
        aria-labelledby="task-status-guide-title"
      >
        <h3 id="task-status-guide-title" className="help-status-subheading">
          Task statuses
        </h3>
        <div className="help-status-card-grid">
          {taskStatuses.map(({ title, icon: Icon, tone, description }) => (
            <article
              className={`help-status-card help-status-card--${tone}`}
              key={title}
              aria-labelledby={`help-status-${tone}`}
            >
              <span className="help-status-card-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <div>
                <h4 id={`help-status-${tone}`}>{title}</h4>
                <p>{description}</p>
              </div>
              <span className={`help-status-badge help-status-badge--${tone}`}>
                <span className="help-status-dot" aria-hidden="true" />
                {title}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section
        className="help-priority-cards"
        aria-labelledby="task-priority-guide-title"
      >
        <h3 id="task-priority-guide-title" className="help-status-subheading">
          Task priorities
        </h3>
        <p className="help-priority-intro">
          Choose a priority when creating or editing a task. Priorities help you
          focus on urgent work and plan the rest of your workload.
        </p>
        <div className="help-priority-card-grid">
          {taskPriorities.map(({ title, badge, description }) => (
            <article className="help-priority-card" key={title}>
              <span className={`priority ${badge}`}>{title}</span>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="help-status-priority-footer">
        <aside className="help-status-movement-note">
          <span className="help-status-footer-icon" aria-hidden="true">
            <Flag size={19} />
          </span>
          <div>
            <h3>Change a task’s status</h3>
            <p>
              Choose a status in the Edit Task form, drag its card to another
              column, or use the keyboard move controls. When it lands in a
              different column, its status updates to match.
            </p>
          </div>
        </aside>

        <aside className="help-status-tips">
          <span className="help-status-footer-icon" aria-hidden="true">
            <Lightbulb size={19} />
          </span>
          <div>
            <h3>Quick tips</h3>
            <ul>
              <li>Use In Progress only while work is actively underway.</li>
              <li>Update a task to Done when its work is complete.</li>
              <li>Reserve High for tasks that genuinely need attention first.</li>
              <li>Status and priority are separate; changing one does not change the other.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default TaskStatusesPrioritiesSection;
