import { useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  CircleCheck,
  Database,
  Flag,
  GripVertical,
  Keyboard,
  ListTodo,
  Pencil,
  Search,
  Smartphone,
  Tag,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import "./FaqSection.css";

const faqItems = [
  {
    id: "create-task",
    icon: ListTodo,
    question: "How do I create a new task?",
    answer:
      "On the dashboard, select + Add Task. Enter a required title; the due date is prefilled for the next 7 days, and you can change it. Add any optional details, then select Create Task to see it in To Do and on its due date in Calendar.",
  },
  {
    id: "edit-task",
    icon: Pencil,
    question: "How can I edit an existing task?",
    answer:
      "Find the task card and select its Edit button. Update the title, description, status, due date, priority, or label, then select Save Changes. You can also change status by moving the card between columns.",
  },
  {
    id: "delete-task",
    icon: Trash2,
    question: "How do I delete a task?",
    answer:
      "Select Delete on the task card, then choose OK in the browser confirmation dialog. Choose Cancel to keep the task. There is no undo, so deletion may be permanent.",
  },
  {
    id: "move-task",
    icon: ArrowRightLeft,
    question: "How can I move tasks between columns?",
    answer:
      "Drag a card into To Do, In Progress, or Done. You can also focus the card, press Enter or Space, use Left or Right to choose a column, then press Enter or Space again to drop it. Moving to a different column updates the task status.",
  },
  {
    id: "task-statuses",
    icon: CircleCheck,
    question: "What do To Do, In Progress, and Done mean?",
    answer:
      "To Do is planned work that has not started. In Progress is work currently underway. Done is completed work. Select a status in the Edit Task form or move the card to the matching column.",
  },
  {
    id: "task-priorities",
    icon: Flag,
    question: "What are task priorities?",
    answer:
      "High means the task needs attention first, Medium means normal importance, and Low means it is not urgent. Priority is separate from status and can be changed when editing a task.",
  },
  {
    id: "search-task",
    icon: Search,
    question: "How can I search for a particular task?",
    answer:
      "Use the Search tasks field in the top navigation while viewing My Tasks. It searches task titles, descriptions, and labels, is case-insensitive, and works together with the status and priority filters.",
  },
  {
    id: "filter-labels",
    icon: Tag,
    question: "How do I filter tasks using labels?",
    answer:
      "A label dropdown is visible in the header, but it is not currently connected to the task board. Selecting a label does not filter the cards yet.",
  },
  {
    id: "rearrange-tasks",
    icon: GripVertical,
    question: "Can I rearrange tasks?",
    answer:
      "Yes. Drop a task before or after another card in the same column. With the keyboard, pick up a focused card using Enter or Space, then use Up or Down to choose its position.",
  },
  {
    id: "save-failure",
    icon: TriangleAlert,
    question: "What happens if a task fails to save?",
    answer:
      "If saving to browser storage fails, the app logs an error to the browser console but does not show an on-screen warning. The task may remain visible in the current session but may be lost after a refresh.",
  },
  {
    id: "task-persistence",
    icon: Database,
    question: "Are my tasks saved after refreshing the page?",
    answer:
      "The board saves task columns in this browser's local storage and restores them when the app loads. This is browser-local storage, not cloud sync; if storage is unavailable or invalid, the app logs an error and loads its default board.",
  },
  {
    id: "mobile",
    icon: Smartphone,
    question: "Can I use the application on mobile devices?",
    answer:
      "Yes, the dashboard layout adapts to smaller screens. Native drag-and-drop support varies by mobile browser; keyboard task movement is available when you use a keyboard.",
  },
  {
    id: "keyboard-board",
    icon: Keyboard,
    question: "How do I navigate the task board using my keyboard?",
    answer:
      "Use Tab and Shift+Tab to move focus through controls and task cards. On a focused task card, press Enter or Space to pick it up, use the arrow keys to select a column and position, then press Enter or Space to drop. Escape cancels; Tab cancels and resumes navigation.",
  },
];

function FaqSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFaqItems = faqItems.filter(({ question, answer }) =>
    `${question} ${answer}`.toLowerCase().includes(normalizedQuery)
  );

  function updateSearch(event) {
    setSearchQuery(event.target.value);
    setExpandedQuestion(null);
  }

  function toggleQuestion(questionId) {
    setExpandedQuestion((currentQuestion) =>
      currentQuestion === questionId ? null : questionId
    );
  }

  return (
    <section className="faq-section" aria-labelledby="faq-section-title">
      <header className="help-section-heading">
        <p className="help-eyebrow">QUICK ANSWERS</p>
        <h2 id="faq-section-title">Frequently Asked Questions (FAQs)</h2>
        <p>Find clear answers about the task board and its current features.</p>
      </header>

      <label className="faq-search">
        <Search size={19} aria-hidden="true" />
        <span className="visually-hidden">Search FAQs</span>
        <input
          type="search"
          value={searchQuery}
          onChange={updateSearch}
          placeholder="Search questions..."
          aria-label="Search FAQs"
        />
      </label>

      {filteredFaqItems.length > 0 ? (
        <div className="faq-list">
          {filteredFaqItems.map(({ id, icon: Icon, question, answer }) => {
            const isExpanded = expandedQuestion === id;
            const questionId = `faq-question-${id}`;
            const answerId = `faq-answer-${id}`;

            return (
              <article className="faq-item" key={id}>
                <h3 className="faq-question-heading">
                  <button
                    className="faq-question"
                    id={questionId}
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={answerId}
                    onClick={() => toggleQuestion(id)}
                  >
                    <span className="faq-question-icon" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <span className="faq-question-text">{question}</span>
                    <ChevronDown
                      className={`faq-chevron${isExpanded ? " is-expanded" : ""}`}
                      size={18}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  className={`faq-answer${isExpanded ? " is-expanded" : ""}`}
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  aria-hidden={!isExpanded}
                >
                  <div className="faq-answer-clip">
                    <p>{answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="faq-no-results" role="status">
          No FAQs match “{searchQuery}”. Try a different search.
        </p>
      )}
    </section>
  );
}

export default FaqSection;
