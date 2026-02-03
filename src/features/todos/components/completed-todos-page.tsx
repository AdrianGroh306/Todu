"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useActiveList } from "@/features/shared/providers/active-list-provider";
import { usePollingTodos, type Todo } from "@/features/todos/hooks/use-polling-todos";
import { Checkbox } from "@/components/checkbox";
import { CloseButton } from "@/components/close-button";

const EXIT_ANIMATION_MS = 280;

type ExitingSnapshot = {
  todo: Todo;
  index: number;
};

type CompletedTodosPageProps = {
  onClose?: () => void;
};

export const CompletedTodosPage = ({ onClose }: CompletedTodosPageProps) => {
  const router = useRouter();
  const { activeList } = useActiveList();
  const {
    completedTodos,
    updateTodo,
    clearCompleted,
    isPending,
  } = usePollingTodos(activeList?.id ?? null);

  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [exitingSnapshots, setExitingSnapshots] = useState<Record<string, ExitingSnapshot>>({});
  const animationTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleBack = () => {
    if (onClose) {
      onClose();
      return;
    }
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

  const isLoading = isPending && completedTodos.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-theme-bg pt-safe">
      <main className="mx-auto flex h-full max-w-3xl flex-col px-4 safe-top text-theme-text">
        <header className="flex shrink-0 items-center justify-between py-4">
          <div className="w-8" />
          <div className="flex items-center gap-2 text-theme-text">
            {isLoading ? (
              <>
                <div className="h-7 w-10 animate-pulse rounded bg-theme-surface/70" />
                <div className="h-6 w-24 animate-pulse rounded bg-theme-surface/70" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{completedTodos.length}</div>
                <h1 className="text-xl font-bold">Erledigt</h1>
              </>
            )}
          </div>
          <CloseButton onClick={handleBack} ariaLabel="Profil schließen" />
        </header>

        <section className="flex flex-1 min-h-0 flex-col gap-4">
          <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-theme-surface/80 p-4 backdrop-blur">
            {isLoading ? (
              <ul className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <li
                    key={`skeleton-${index}`}
                    className="flex items-center justify-between rounded-xl border border-theme-border/50 px-4 py-3"
                  >
                    <div className="h-4 w-2/3 animate-pulse rounded bg-theme-surface/70" />
                    <div className="h-4 w-4 animate-pulse rounded bg-theme-surface/70" />
                  </li>
                ))}
              </ul>
            ) : visibleTodos.length === 0 ? (
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
                    <label className="p-1 -m-1 cursor-pointer">
                      <Checkbox
                        visualSize="sm"
                        className="accent-theme-primary"
                        checked
                        onChange={() => handleReopenTodo(todo, sourceIndex)}
                        disabled={isExiting}
                      />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <footer className="shrink-0 py-4 safe-bottom">
          <button
            className="mx-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-theme-text bg-theme-delete transition hover:border-rose-400 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleClearCompleted}
            disabled={isLoading || completedTodos.length === 0 || clearCompleted.isPending}
          >
              <div className="text-theme-surface flex gap-1.5">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Alle löschen
              </div>
          </button>
        </footer>
      </main>

    </div>
  );
};
