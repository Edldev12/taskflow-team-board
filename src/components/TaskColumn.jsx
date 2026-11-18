
import TaskCard from "./TaskCard";

//function TaskColumn({ column }) {
function TaskColumn({ column, onEdit, onDelete }) {
  return (
    <section className="task-column">
      <div className="column-heading">
        <div className="column-title">
          <span className={`status-dot ${column.color}`}></span>
          <h2>{column.title}</h2>
        </div>

        <span className="task-count">{column.tasks.length}</span>
      </div>

      <div className="column-tasks">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

export default TaskColumn;
