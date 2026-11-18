
import { useEffect, useState } from "react";
import "./TaskModal.css";

function TaskModal({ isOpen, onClose, onSave, task }) {
  const [formData, setFormData] = useState(() => ({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "Medium",
    label: task?.label || "",
  }));

  const [error, setError] = useState("");

  const isEditing = Boolean(task);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const title = formData.title.trim();

    if (!title) {
      setError("Task title is required.");
      return;
    }

    if (title.length > 100) {
      setError("Task title must be 100 characters or fewer.");
      return;
    }

    if (formData.description.length > 500) {
      setError("Description must be 500 characters or fewer.");
      return;
    }

    onSave({
      ...formData,
      title,
      description: formData.description.trim(),
      label: formData.label.trim(),
    });
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <div className="modal-header">
          <h2 id="task-modal-title">
            {isEditing ? "Edit Task" : "Create New Task"}
          </h2>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Task Title *</label>
            <input
              id="task-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              maxLength={100}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your task"
              maxLength={500}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="task-label">Label</label>
            <input
              id="task-label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              placeholder="e.g. Design, Frontend"
              maxLength={30}
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="save-button">
              {isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default TaskModal;
