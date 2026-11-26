import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  CircleCheck,
  FileText,
  Flag,
  Lightbulb,
  ListTodo,
  MousePointerClick,
  Pencil,
  Search,
  ShieldCheck,
  Tag,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import FaqSection from "./FaqSection";
import HelpDragDropGuide from "./HelpDragDropGuide";
import KeyboardShortcutsSection from "./KeyboardShortcutsSection";
import TaskStatusesPrioritiesSection from "./TaskStatusesPrioritiesSection";
import "./HelpCenter.css";

const creationSteps = [
  {
    icon: MousePointerClick,
    title: "Open the task form",
    description:
      "From the dashboard, click the + Add Task button near the top-right of the page.",
  },
  {
    icon: FileText,
    title: "Describe the task",
    description:
      "Enter a short title. It is required. Add an optional description with any extra details.",
  },
  {
    icon: Flag,
    title: "Choose priority and label",
    description:
      "A To Do task gets a date in the next 7 days; undated In Progress tasks get today, and undated Done tasks get yesterday. You can change the date, choose a priority, and add an optional label.",
  },
  {
    icon: CircleCheck,
    title: "Create and check your task",
    description:
      "Click Create Task. The form closes and the new task appears in the To Do column.",
  },
];

const editSteps = [
  {
    title: "Find the task",
    description:
      "Look through the To Do, In Progress, and Done columns until you find its card.",
  },
  {
    title: "Open the edit form",
    description:
      "Select the Edit button at the bottom of that task card. The Edit Task form opens with its current details.",
  },
  {
    title: "Update its details",
    description:
      "Change the title, description, status, due date, priority, or label in the Edit Task form.",
  },
  {
    title: "Save or cancel",
    description:
      "Select Save Changes to keep your updates. Select Cancel or close the form to discard unsaved edits.",
  },
];

const deleteSteps = [
  {
    title: "Locate the task card",
    description:
      "Find the task in its current To Do, In Progress, or Done column.",
  },
  {
    title: "Select Delete",
    description:
      "Choose the Delete button at the bottom of the task card.",
  },
  {
    title: "Confirm your choice",
    description:
      "In the confirmation dialog, choose OK to remove the task or Cancel to keep it.",
  },
];

function HelpCenter({ onReturnToDashboard }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="dashboard-content help-center"
      id="help"
      aria-labelledby="help-center-title"
    >
      <header className="help-center-header">
        <div>
          <p className="help-eyebrow">HELP CENTER</p>
          <h1 id="help-center-title" ref={headingRef} tabIndex="-1">
            Help Center
          </h1>
          <p className="help-center-subtitle">
            Simple guidance for creating and organizing your work.
          </p>
        </div>
        <button
          className="help-back-button"
          type="button"
          onClick={onReturnToDashboard}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Return to Dashboard
        </button>
      </header>

      <section className="help-guide-card" aria-labelledby="create-tasks-title">
        <div className="help-guide-heading">
          <div className="help-guide-icon" aria-hidden="true">
            <ListTodo size={23} />
          </div>
          <div>
            <p className="help-eyebrow">TASK BASICS</p>
            <h2 id="create-tasks-title">How to Create Tasks</h2>
            <p>Follow these steps to add a task to your board.</p>
          </div>
        </div>

        <ol className="help-steps">
          {creationSteps.map(({ icon: Icon, title, description }, index) => (
            <li className="help-step" key={title}>
              <span className="help-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="help-step-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="help-manage-section"
        aria-labelledby="edit-delete-tasks-title"
      >
        <div className="help-section-heading">
          <p className="help-eyebrow">TASK MANAGEMENT</p>
          <h2 id="edit-delete-tasks-title">How to Edit and Delete Tasks</h2>
          <p>Update a task when plans change, or remove one you no longer need.</p>
        </div>

        <div className="help-actions-grid">
          <article
            className="help-action-card"
            aria-labelledby="edit-task-title"
          >
            <header className="help-action-heading">
              <span className="help-action-icon" aria-hidden="true">
                <Pencil size={20} />
              </span>
              <div>
                <h3 id="edit-task-title">Edit a task</h3>
                <p>Keep task details up to date.</p>
              </div>
            </header>

            <ol className="help-action-steps">
              {editSteps.map(({ title, description }, index) => (
                <li className="help-action-step" key={title}>
                  <span className="help-step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <aside className="help-action-tip">
              <ShieldCheck size={18} aria-hidden="true" />
              <p>
                Check the task title before saving. You can also change the
                status by moving its card to another column.
              </p>
            </aside>
          </article>

          <article
            className="help-action-card help-action-card--delete"
            aria-labelledby="delete-task-title"
          >
            <header className="help-action-heading">
              <span className="help-action-icon" aria-hidden="true">
                <Trash2 size={20} />
              </span>
              <div>
                <h3 id="delete-task-title">Delete a task</h3>
                <p>Remove a task you no longer need.</p>
              </div>
            </header>

            <ol className="help-action-steps">
              {deleteSteps.map(({ title, description }, index) => (
                <li className="help-action-step" key={title}>
                  <span className="help-step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h4>{title}</h4>
                    <p>{description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <aside className="help-action-warning">
              <TriangleAlert size={18} aria-hidden="true" />
              <p>
                Deletion has no undo in this app and may be permanent. Before
                confirming, double-check that you selected the right task.
              </p>
            </aside>
            <p className="help-delete-tip">
              <Search size={16} aria-hidden="true" />
              If you are unsure, choose Cancel and review the task first.
            </p>
          </article>
        </div>
      </section>

      <HelpDragDropGuide />

      <TaskStatusesPrioritiesSection />

      <KeyboardShortcutsSection />

      <section className="help-fields-section" aria-labelledby="task-fields-title">
        <div className="help-section-heading">
          <div>
            <p className="help-eyebrow">THE TASK FORM</p>
            <h2 id="task-fields-title">What each field does</h2>
          </div>
        </div>

        <div className="help-field-grid">
          <article className="help-info-card">
            <span className="help-info-icon" aria-hidden="true">
              <FileText size={19} />
            </span>
            <h3>Title</h3>
            <p>Required. Keep it under 100 characters and make the action clear.</p>
          </article>
          <article className="help-info-card">
            <span className="help-info-icon" aria-hidden="true">
              <FileText size={19} />
            </span>
            <h3>Description</h3>
            <p>Optional. Add context or details, up to 500 characters.</p>
          </article>
          <article className="help-info-card">
            <span className="help-info-icon" aria-hidden="true">
              <Flag size={19} />
            </span>
            <h3>Priority</h3>
            <p>Choose High, Medium, or Low. New tasks default to Medium.</p>
          </article>
          <article className="help-info-card">
            <span className="help-info-icon" aria-hidden="true">
              <Tag size={19} />
            </span>
            <h3>Label</h3>
            <p>Optional free text, up to 30 characters. Use a short category name.</p>
          </article>
        </div>
      </section>

      <div className="help-bottom-grid">
        <aside className="help-note-card" aria-labelledby="task-status-title">
          <div className="help-note-icon" aria-hidden="true">
            <ListTodo size={20} />
          </div>
          <div>
            <h2 id="task-status-title">Where does a new task go?</h2>
            <p>
              Status is not selected in the creation form. New tasks start in
              <strong> To Do</strong>. Move them between columns on the board
              with drag and drop or the keyboard controls.
            </p>
          </div>
        </aside>

        <aside className="help-tips-card" aria-labelledby="task-tips-title">
          <div className="help-note-icon" aria-hidden="true">
            <Lightbulb size={20} />
          </div>
          <div>
            <h2 id="task-tips-title">Helpful tips</h2>
            <ul>
              <li>Start titles with an action, like “Review the draft.”</li>
              <li>Use familiar labels consistently to keep tasks organized.</li>
              <li>Set priority by urgency, then update it as work changes.</li>
            </ul>
          </div>
        </aside>
      </div>

      <FaqSection />
    </section>
  );
}

export default HelpCenter;
