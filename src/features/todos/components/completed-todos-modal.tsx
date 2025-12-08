import { Modal } from "@/components/modal";
import { Checkbox } from "@/components/checkbox";
import type { Todo } from "@/features/todos/hooks/use-todos";

type CompletedTodosModalProps = {
  open: boolean;
  onClose: () => void;
  completedTodos: Todo[];
  onReopenTodo: (todo: Todo) => void;
  onClearCompleted: () => void;
  isClearing: boolean;
};

export const CompletedTodosModal = ({
  open,
  onClose,
  completedTodos,
  onReopenTodo,
  onClearCompleted,
  isClearing,
}: CompletedTodosModalProps) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Erledigte Todos"
      footer={
        <button
          className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onClearCompleted}
          disabled={completedTodos.length === 0 || isClearing}
        >
          {isClearing ? "Lösche erledigte…" : "Alle erledigten löschen"}
        </button>
      }
    >
      {completedTodos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-theme-border/80 px-4 py-8 text-center text-sm text-theme-text-muted">
          Keine erledigten Todos vorhanden.
        </p>
      ) : (
        <ul className="min-h-[300px] max-h-[60vh] overflow-y-auto divide-y divide-theme-border/50 pr-1">
          {completedTodos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center justify-between px-4 py-3 text-sm text-theme-text-muted line-through"
            >
              <span>{todo.text}</span>
              <Checkbox
                visualSize="sm"
                className="accent-theme-primary"
                checked
                onChange={() => onReopenTodo(todo)}
              />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
