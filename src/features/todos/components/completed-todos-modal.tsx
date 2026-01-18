import { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, ListChecks } from "lucide-react";
import { Modal } from "@/components/modal";
import { Checkbox } from "@/components/checkbox";
import type { Todo } from "@/features/todos/hooks/use-todos";

const EXIT_ANIMATION_MS = 280;

type ExitingSnapshot = {
  todo: Todo;
  index: number;
};

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
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [exitingSnapshots, setExitingSnapshots] = useState<Record<string, ExitingSnapshot>>({});
  const animationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const startExitAnimation = (todo: Todo, index: number) => {
    if (exitingIds.has(todo.id)) {
      return;
    }
    setExitingSnapshots((prev) => ({
      ...prev,
      [todo.id]: { todo, index },
    }));
    setExitingIds((prev) => {
      if (prev.has(todo.id)) return prev;
      const next = new Set(prev);
      next.add(todo.id);
      return next;
    });

    if (animationTimers.current[todo.id]) {
      clearTimeout(animationTimers.current[todo.id]);
    }
    animationTimers.current[todo.id] = setTimeout(() => {
      setExitingIds((prev) => {
        if (!prev.has(todo.id)) return prev;
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
      setExitingSnapshots((prev) => {
        const next = { ...prev };
        delete next[todo.id];
        return next;
      });
      delete animationTimers.current[todo.id];
    }, EXIT_ANIMATION_MS);
  };

  const handleReopenClick = (todo: Todo, index: number) => {
    startExitAnimation(todo, index);
    onReopenTodo(todo);
  };

  const visibleTodos = useMemo(() => {
    const completedEntries = completedTodos.map((todo, index) => ({
      todo: exitingSnapshots[todo.id]?.todo ?? todo,
      isExiting: exitingIds.has(todo.id),
      sourceIndex: index,
    }));

    const exitingOnly = Array.from(exitingIds)
      .filter((id) => !completedTodos.some((todo) => todo.id === id))
      .map((id) => exitingSnapshots[id])
      .filter((snapshot): snapshot is ExitingSnapshot => Boolean(snapshot))
      .sort((a, b) => a.index - b.index)
      .map(({ todo, index }) => ({
        todo,
        sourceIndex: index,
      }));

    const merged = [...completedEntries];
    exitingOnly.forEach(({ todo, sourceIndex }) => {
      const insertIndex = Math.min(sourceIndex, merged.length);
      merged.splice(insertIndex, 0, { todo, isExiting: true, sourceIndex });
    });

    return merged;
  }, [completedTodos, exitingIds, exitingSnapshots]);

  useEffect(() => {
    const timersAtMount = animationTimers.current;
    return () => {
      Object.values(timersAtMount).forEach(clearTimeout);
    };
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<div className="flex items-center gap-2"><ListChecks className="h-6 w-6" aria-hidden="true" />Erledigte Todos</div>}
      footer={
        <button
          className="mx-auto flex items-center gap-2 rounded-full border border-theme-border px-5 py-3 text-sm font-semibold text-theme-text transition hover:border-rose-400 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onClearCompleted}
          disabled={completedTodos.length === 0 || isClearing}
        >
          {isClearing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-transparent" />
              Lösche…
            </>
          ) : (
            <div className="text-theme-delete flex gap-1.5">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Alle löschen
            </div>
          )}
        </button>
      }
    >
      <div className="flex flex-1 min-h-0 flex-col">
        {visibleTodos.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-theme-border/80 px-4 py-8 text-center text-sm text-theme-text-muted">
            Keine erledigten Todos vorhanden.
          </p>
        ) : (
          <ul className="flex-1 overflow-y-auto divide-y divide-theme-border/50 pr-1">
            {visibleTodos.map(({ todo, isExiting, sourceIndex }) => (
              <li
                key={todo.id}
                className={`flex items-center justify-between px-4 py-3 text-sm text-theme-text-muted line-through transition-all duration-200 ease-out ${isExiting ? "-translate-x-4 opacity-0" : "opacity-100"
                  }`}
              >
                <span>{todo.text}</span>
                <Checkbox
                  visualSize="sm"
                  className="accent-theme-primary"
                  checked
                  onChange={() => handleReopenClick(todo, sourceIndex)}
                  disabled={isExiting}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
};
