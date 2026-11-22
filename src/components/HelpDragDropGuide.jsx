import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Keyboard,
  MousePointer2,
} from "lucide-react";
import "./HelpDragDropGuide.css";

const dragSteps = [
  {
    icon: MousePointer2,
    title: "Pick up a task",
    description:
      "On a computer, move the pointer over a task card, then press and hold the mouse button. The card dims while you drag it.",
  },
  {
    icon: ArrowRight,
    title: "Choose a destination",
    description:
      "Keep holding and move over To Do, In Progress, or Done. The destination column highlights; a blue line shows where the card will land near another task.",
  },
  {
    icon: CircleCheck,
    title: "Drop the task",
    description:
      "Release the mouse button over the column or desired position. The board updates and announces a successful move.",
  },
];

function HelpDragDropGuide() {
  return (
    <section
      className="help-drag-section"
      aria-labelledby="help-drag-title"
    >
      <header className="help-section-heading">
        <p className="help-eyebrow">MOVE WORK ON THE BOARD</p>
        <h2 id="help-drag-title">How to Use Drag and Drop</h2>
        <p>
          Drag and drop lets you pick up a task card, move it to a new place,
          and release it there.
        </p>
      </header>

      <ol className="help-drag-steps">
        {dragSteps.map(({ icon: Icon, title, description }, index) => (
          <li className="help-drag-step" key={title}>
            <div className="help-drag-step-heading">
              <span className="help-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="help-drag-step-icon" aria-hidden="true">
                <Icon size={19} strokeWidth={1.8} />
              </span>
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
          </li>
        ))}
      </ol>

      <figure className="help-dnd-demo">
        <figcaption id="help-dnd-demo-caption">
          Example board: move a card from one status column to another.
        </figcaption>
        <div
          className="help-dnd-board"
          aria-describedby="help-dnd-demo-caption"
        >
          <div className="help-dnd-column help-dnd-column--todo">
            <h3>
              <span className="help-dnd-dot" aria-hidden="true" />
              To Do
            </h3>
            <div className="help-dnd-task">
              <strong>Draft project plan</strong>
              <span>Example task card</span>
            </div>
          </div>

          <span className="help-dnd-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </span>

          <div className="help-dnd-column help-dnd-column--progress">
            <h3>
              <span className="help-dnd-dot" aria-hidden="true" />
              In Progress
            </h3>
            <div className="help-dnd-dropzone">
              <span aria-hidden="true" />
              Drop between tasks
            </div>
          </div>

          <span className="help-dnd-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </span>

          <div className="help-dnd-column help-dnd-column--done">
            <h3>
              <span className="help-dnd-dot" aria-hidden="true" />
              Done
            </h3>
            <div className="help-dnd-task help-dnd-task--done">
              <strong>Completed task</strong>
              <span>Drop in this column to finish</span>
            </div>
          </div>
        </div>
      </figure>

      <div className="help-dnd-details">
        <article className="help-dnd-detail-card">
          <h3>Reorder tasks in a column</h3>
          <p>
            Yes. Drop a card above or below another card in the same column.
            The blue insertion line shows its new position. Its status stays
            the same.
          </p>
        </article>
        <article className="help-dnd-detail-card help-dnd-detail-card--keyboard">
          <div className="help-dnd-detail-heading">
            <Keyboard size={18} aria-hidden="true" />
            <h3>Prefer the keyboard?</h3>
          </div>
          <p>
            Focus a task card and press Enter or Space to pick it up. Use Left
            and Right to choose a column, Up and Down to choose a position, then
            press Enter or Space to drop. Press Escape to cancel; Tab cancels
            and continues navigation.
          </p>
        </article>
      </div>

      <aside className="help-dnd-feedback" aria-labelledby="help-dnd-feedback-title">
        <CircleAlert size={19} aria-hidden="true" />
        <div>
          <h3 id="help-dnd-feedback-title">If a move does not work</h3>
          <p>
            A valid cross-column move updates the task status to match its new
            column. If a drop is not accepted, the task stays where it was; the
            board does not show an error message, so try again over a highlighted
            column or task position. If saving to browser storage fails, the
            current view may still show the move, but it may not survive a
            refresh; the app logs that save error to the browser console.
          </p>
        </div>
      </aside>

      <p className="help-dnd-tip">
        Tip: Start dragging from the body of the task card, aim for a visible
        column, and wait for the highlight or insertion line before releasing.
        On mobile, native drag support varies by browser; use the keyboard
        controls where available.
      </p>
    </section>
  );
}

export default HelpDragDropGuide;
