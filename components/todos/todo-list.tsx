"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, CheckCircle } from "lucide-react";
import type { Todo } from "./use-todos";
import { useTodos } from "./use-todos";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Modal } from "@/components/ui/modal";

const EXIT_ANIMATION_MS = 280;

type TimerMap = Record<string, ReturnType<typeof setTimeout>>;

export function TodoList() {
  const [text, setText] = useState("");
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);
  const animationTimers = useRef<TimerMap>({});

  const {
    todos,
    isPending,
    isError,
    createTodo,
    updateTodo,
    clearCompleted,
    invalidateTodos,
  } = useTodos();

  const completedTodos = useMemo(() => todos.filter((t) => t.done), [todos]);
  const totalTodos = todos.length;
  const completedCount = completedTodos.length;

  const visibleTodos = useMemo(
    () => todos.filter((t) => !t.done || animatingIds.has(t.id)),
    [todos, animatingIds],
  );

  const startExitAnimation = (todo: Todo) => {
    setAnimatingIds((prev) => {
      if (prev.has(todo.id)) return prev;
      return new Set(prev).add(todo.id);
    });

    if (animationTimers.current[todo.id]) {
      clearTimeout(animationTimers.current[todo.id]);
    }

    animationTimers.current[todo.id] = setTimeout(() => {
      setAnimatingIds((prev) => {
        if (!prev.has(todo.id)) return prev;
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
      delete animationTimers.current[todo.id];
      invalidateTodos();
    }, EXIT_ANIMATION_MS);
  };

  const clearExitAnimation = (id: string) => {
    if (animationTimers.current[id]) {
      clearTimeout(animationTimers.current[id]);
      delete animationTimers.current[id];
    }
    setAnimatingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleToggleTodo = (todo: Todo) => {
    const nextDone = !todo.done;
    if (nextDone) {
      startExitAnimation(todo);
    } else {
      clearExitAnimation(todo.id);
    }

    updateTodo.mutate(
      { id: todo.id, done: nextDone },
      { onError: () => nextDone && clearExitAnimation(todo.id) },
    );
  };

  const handleReopenTodo = (todo: Todo) => {
    clearExitAnimation(todo.id);
    updateTodo.mutate({ id: todo.id, done: false });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;
    createTodo.mutate({ text: text.trim() }, { onSuccess: () => setText("") });
  };

  const handleClearCompleted = () => {
    if (completedTodos.length === 0) return;
    clearCompleted.mutate(completedTodos.map((t) => t.id));
  };

  useEffect(() => {
    const timers = animationTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  return (
    <main className="mx-auto flex h-screen max-w-3xl flex-col gap-6 overflow-hidden px-4 pt-4 text-slate-100">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-semibold uppercase tracking-[0.35em] text-slate-400">
            Clarydo
          </h1>
          <button
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
              completedTodos.length === 0
                ? "cursor-not-allowed border-slate-800 text-slate-600"
                : "border-slate-700 text-slate-100 hover:border-slate-500"
            }`}
            onClick={() => setShowCompleted(true)}
            disabled={completedTodos.length === 0}
          >
            <CheckCircle className="h-4 w-4" />
            Erledigt
          </button>
        </div>
        <ProgressBar value={completedCount} max={totalTodos} label="Todo-Fortschritt" />
      </header>

      <section className="flex flex-1 flex-col gap-6 overflow-hidden rounded-2xl p-6 backdrop-blur">
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {isPending ? (
            <EmptyState>Lade Aufgaben…</EmptyState>
          ) : isError ? (
            <ErrorState>Fehler beim Laden der Aufgaben.</ErrorState>
          ) : totalTodos === 0 ? (
            <EmptyState dashed>
              Noch keine Einträge – starte unten mit deiner ersten Aufgabe.
            </EmptyState>
          ) : visibleTodos.length === 0 ? (
            <EmptyState dashed>
              Alle Todos sind erledigt – öffne die Erledigt-Ansicht oben rechts.
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {visibleTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isExiting={animatingIds.has(todo.id)}
                  onToggle={() => handleToggleTodo(todo)}
                />
              ))}
            </ul>
          )}
        </div>

        {completedTodos.length > 0 && (
          <button
            onClick={handleClearCompleted}
            className="text-sm font-medium text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed"
            disabled={clearCompleted.isPending}
          >
            {clearCompleted.isPending ? "Lösche erledigte…" : "Erledigte Todos entfernen"}
          </button>
        )}

        <form
          className="sticky bottom-0 flex items-center gap-3 border-t border-slate-800 pt-4 backdrop-blur"
          onSubmit={handleSubmit}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Neues Todo hinzufügen"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-500/40"
          />
          <button
            type="submit"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            aria-label="Aufgabe speichern"
            disabled={!text.trim() || createTodo.isPending}
          >
            <Plus className="h-5 w-5" />
          </button>
        </form>
      </section>

      <Modal
        open={showCompleted}
        onClose={() => setShowCompleted(false)}
        title="Erledigte Todos"
        footer={
          <button
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-900/50"
            onClick={handleClearCompleted}
            disabled={completedTodos.length === 0 || clearCompleted.isPending}
          >
            {clearCompleted.isPending ? "Lösche erledigte…" : "Alle erledigten löschen"}
          </button>
        }
      >
        {completedTodos.length === 0 ? (
          <EmptyState dashed>Keine erledigten Todos vorhanden.</EmptyState>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {completedTodos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-400 line-through"
              >
                <span>{todo.text}</span>
                <Checkbox visualSize="sm" checked onChange={() => handleReopenTodo(todo)} />
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </main>
  );
}

type TodoItemProps = {
  todo: Todo;
  isExiting: boolean;
  onToggle: () => void;
};

function TodoItem({ todo, isExiting, onToggle }: TodoItemProps) {
  return (
    <li
      className={`group flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 transition-all duration-200 ease-out ${
        isExiting ? "translate-x-4 opacity-0" : "opacity-100"
      }`}
    >
      <label className="flex w-full cursor-pointer items-center gap-3">
        <span
          className={`flex-1 text-base transition-all duration-200 ${
            todo.done ? "text-slate-500 line-through" : "text-slate-100"
          }`}
        >
          {todo.text}
        </span>
        <Checkbox checked={todo.done} onChange={onToggle} />
      </label>
    </li>
  );
}

type EmptyStateProps = {
  children: React.ReactNode;
  dashed?: boolean;
};

function EmptyState({ children, dashed }: EmptyStateProps) {
  return (
    <p
      className={`rounded-xl px-4 py-8 text-center text-sm text-slate-400 ${
        dashed ? "border border-dashed border-slate-700/80" : ""
      }`}
    >
      {children}
    </p>
  );
}

function ErrorState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-red-500/50 bg-red-950/60 px-4 py-3 text-center text-sm text-red-200">
      {children}
    </p>
  );
}
