export function isValidDueDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function getStatusBasedDueDate(
  status,
  todoIndex = 0,
  referenceDate = new Date()
) {
  const date = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  if (status === "done") {
    date.setDate(date.getDate() - 1);
  } else if (status === "todo") {
    date.setDate(date.getDate() + 1 + (todoIndex % 7));
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function assignMissingDueDates(columns, referenceDate = new Date()) {
  let todoIndex = 0;

  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) => {
      const currentTodoIndex =
        column.id === "todo" ? todoIndex++ : todoIndex;
      if (isValidDueDate(task.dueDate)) return task;

      return {
        ...task,
        dueDate: getStatusBasedDueDate(
          column.id,
          currentTodoIndex,
          referenceDate
        ),
      };
    }),
  }));
}
