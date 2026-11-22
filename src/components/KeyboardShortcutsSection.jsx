import { Keyboard } from "lucide-react";
import "./KeyboardShortcutsSection.css";

const shortcutRows = [
  {
    action: "Move focus forward",
    combinations: [["Tab"]],
    description:
      "Move to the next link, button, input, or task card. The visible focus ring shows where you are.",
  },
  {
    action: "Move focus backward",
    combinations: [["Shift", "Tab"]],
    description: "Move focus to the previous interactive item.",
  },
  {
    action: "Create a task",
    combinations: [["Tab"], ["Enter"], ["Space"]],
    description:
      "Tab to + Add Task, then press Enter or Space to open the form.",
  },
  {
    action: "Edit a task",
    combinations: [["Tab"], ["Enter"], ["Space"]],
    description:
      "Tab to a task card, then to its Edit button. Press Enter or Space to open the edit form.",
  },
  {
    action: "Pick up or drop a focused task",
    combinations: [["Enter"], ["Space"]],
    description:
      "On a focused task card, press Enter or Space once to pick it up and again to drop it.",
  },
  {
    action: "Choose a destination column",
    combinations: [["Arrow Left"], ["Arrow Right"]],
    description:
      "While moving a task with the keyboard, use Left or Right to choose a column.",
  },
  {
    action: "Choose a task position",
    combinations: [["Arrow Up"], ["Arrow Down"]],
    description:
      "While moving a task with the keyboard, use Up or Down to choose its position.",
  },
  {
    action: "Cancel task movement",
    combinations: [["Escape"]],
    description: "Cancel a picked-up task without moving it.",
  },
  {
    action: "Continue normal navigation",
    combinations: [["Tab"]],
    description:
      "Tab cancels keyboard task movement and continues through the page.",
  },
  {
    action: "Navigate or close the task dialog",
    combinations: [["Tab"], ["Shift", "Tab"], ["Escape"]],
    description:
      "Tab and Shift+Tab move between dialog controls. Escape closes the dialog.",
  },
];

function ShortcutKeys({ combinations }) {
  return (
    <div className="shortcut-key-groups">
      {combinations.map((combination, index) => (
        <span className="shortcut-key-combination" key={`${combination.join("-")}-${index}`}>
          {combination.map((key, keyIndex) => (
            <span className="shortcut-key-part" key={key}>
              {keyIndex > 0 && (
                <span className="shortcut-key-plus" aria-hidden="true">
                  +
                </span>
              )}
              <kbd>{key}</kbd>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

function KeyboardShortcutsSection() {
  return (
    <section
      className="help-keyboard-section"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <header className="help-section-heading">
        <p className="help-eyebrow">ACCESSIBILITY</p>
        <h2 id="keyboard-shortcuts-title">Keyboard Shortcuts</h2>
        <p>
          Use these keyboard controls to navigate the board and move tasks.
          They work the same on Windows and Mac.
        </p>
      </header>

      <div className="keyboard-shortcuts-table-wrap">
        <table className="keyboard-shortcuts-table">
          <caption className="visually-hidden">
            Keyboard controls available in TaskFlow
          </caption>
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Keys</th>
              <th scope="col">What it does</th>
            </tr>
          </thead>
          <tbody>
            {shortcutRows.map(({ action, combinations, description }) => (
              <tr key={action}>
                <th scope="row">{action}</th>
                <td>
                  <ShortcutKeys combinations={combinations} />
                </td>
                <td>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="keyboard-shortcuts-note">
        <Keyboard size={19} aria-hidden="true" />
        <p>
          <strong>How keyboard navigation works:</strong> press Tab to move
          forward and Shift+Tab to move backward. Buttons can be activated with
          Enter or Space. Focus stays inside the task dialog until it is closed.
          No Ctrl/Cmd global shortcuts are currently assigned.
        </p>
      </div>
      <p className="keyboard-search-note">
        <strong>Searching:</strong> The header search field has no keyboard
        shortcut, and it is not currently connected to task filtering, so no
        search shortcut is listed.
      </p>
    </section>
  );
}

export default KeyboardShortcutsSection;
