"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { useActiveList } from "@/features/shared/providers/active-list-provider";
import { usePollingTodos, type Todo } from "@/features/todos/hooks/use-polling-todos";
import { Checkbox } from "@/components/checkbox";

const EXIT_ANIMATION_MS = 280;

type ExitingSnapshot = {
  todo: Todo;
  index: number;
};

export const CompletedTodosPage = () => {
  const router = useRouter();
  const { activeList } = useActiveList();
  const { completedTodos, updateTodo, clearCompleted } = usePollingTodos(activeList?.id ?? null);

  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [exitingSnapshots, setExitingSnapshots] = useState<Record<string, ExitingSnapshot>>({});
  const animationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleBack = () => {
    router.back();
  };

  const startExitAnimation = (todo: Todo, index: number) => {
    if (exitingIds.has(todo.id)) return;

    setExitingSnapshots((prev) => ({
      ...prev,
      [todo.id]: { todo, index },
    }));
    setExitingIds((prev) => {
      const next = new Set(prev);
      next.add(todo.id);
      return next;
    });

    animationTimers.current[todo.id] = setTimeout(() => {
      setExitingIds((prev) => {
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

  const handleReopenTodo = (todo: Todo, index: number) => {
    startExitAnimation(todo, index);
    updateTodo.mutate({ id: todo.id, done: false });
  };

  const handleClearCompleted = () => {
    if (completedTodos.length === 0) return;
    clearCompleted.mutate(completedTodos.map((t) => t.id));
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
    const timers = animationTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-theme-bg pt-safe">
      <main className="mx-auto flex h-full max-w-3xl flex-col px-4 safe-top text-theme-text">
        <header className="flex shrink-0 items-center justify-between py-4">
          <div className="w-8" />
          <div className="flex items-center gap-2 text-theme-text">
            <div className="text-2xl font-semibold">{completedTodos.length}</div>
            <h1 className="text-xl font-semibold">Erledigt</h1>
          </div>
          <button
            type="button"
            onClick={handleBack}
            aria-label="Profil schließen"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-theme-border bg-theme-surface text-theme-text transition hover:border-theme-primary hover:text-theme-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <section className="flex flex-1 min-h-0 flex-col gap-4">
          <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-theme-surface/80 p-4 backdrop-blur">
            {visibleTodos.length === 0 ? (
              <p className="flex h-full items-center justify-center rounded-xl border border-dashed border-theme-border/80 px-4 py-8 text-center text-sm text-theme-text-muted">
                Keine erledigten Todos vorhanden.
              </p>
            ) : (
              <ul className="divide-y divide-theme-border/50">
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
                      onChange={() => handleReopenTodo(todo, sourceIndex)}
                      disabled={isExiting}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <footer className="shrink-0 py-4 safe-bottom">
          <button
            className="mx-auto flex items-center gap-2 rounded-full border border-theme-border px-5 py-3 text-sm font-semibold text-theme-text transition hover:border-rose-400 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleClearCompleted}
            disabled={completedTodos.length === 0 || clearCompleted.isPending}
          >
            {clearCompleted.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-transparent" />
                Lösche...
              </>
            ) : (
              <div className="text-theme-delete flex gap-1.5">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Alle löschen
              </div>
            )}
          </button>
        </footer>
      </main>

    </div>
  );
};
