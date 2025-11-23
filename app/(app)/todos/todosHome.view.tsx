"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, CheckCircle, X } from "lucide-react";
import type { Todo } from "./useTodos";
import { useTodos } from "./useTodos";

const EXIT_ANIMATION_MS = 280;

type TimerMap = Record<string, ReturnType<typeof setTimeout>>;

export function TodosHomeView() {
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
  } = useTodos();

  const activeTodos = useMemo(
    () => todos.filter((todo) => !todo.done),
    [todos],
  );

  const remaining = activeTodos.length;

  const completedTodos = useMemo(
    () => todos.filter((todo) => todo.done),
    [todos],
  );

  const totalTodos = todos.length;
  const completedCount = totalTodos - remaining;
  const completionRatio = totalTodos === 0 ? 0 : completedCount / totalTodos;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    createTodo.mutate(
      { text: text.trim() },
      { onSuccess: () => setText("") },
    );
  };

  const startExitAnimation = (todo: Todo) => {
    setAnimatingIds((prev) => {
      if (prev.has(todo.id)) return prev;
      const next = new Set(prev);
      next.add(todo.id);
      return next;
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
      {
        onError: () => {
          if (nextDone) {
            clearExitAnimation(todo.id);
          }
        },
      },
    );
  };

  const handleReopenTodo = (todo: Todo) => {
    clearExitAnimation(todo.id);
    updateTodo.mutate({ id: todo.id, done: false });
  };

  const clearCompletedTodos = () => {
    if (completedTodos.length === 0) return;
    clearCompleted.mutate(completedTodos.map((todo) => todo.id));
  };

  const visibleActiveTodos = useMemo(
    () =>
      todos.filter((todo) => !todo.done || animatingIds.has(todo.id)),
    [todos, animatingIds],
  );

  const hasVisibleTodos = visibleActiveTodos.length > 0;

  useEffect(() => {
    return () => {
      Object.values(animationTimers.current).forEach((timer) =>
        clearTimeout(timer),
      );
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
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${completedTodos.length === 0
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
        <div className="h-2 w-full rounded-full bg-slate-800">
          <div
            role="progressbar"
            aria-label="Todo-Fortschritt"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(completionRatio * 100)}
            aria-valuetext={`${completedCount} von ${totalTodos} erledigt`}
            style={{ width: `${completionRatio * 100}%` }}
            className="h-full rounded-full bg-linear-to-r from-slate-300 to-slate-50 transition-[width] duration-300 ease-out"
          />
        </div>
      </header>

      <section className="flex flex-1 flex-col gap-6 overflow-hidden rounded-2xl p-6 backdrop-blur">
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {isPending ? (
            <p className="text-center text-sm text-slate-400">Lade Aufgaben…</p>
          ) : isError ? (
            <p className="rounded-xl border border-red-500/50 bg-red-950/60 px-4 py-3 text-center text-sm text-red-200">
              Fehler beim Laden der Aufgaben.
            </p>
          ) : todos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700/80 px-4 py-8 text-center text-sm text-slate-400">
              Noch keine Einträge – starte unten mit deiner ersten Aufgabe.
            </p>
          ) : !hasVisibleTodos ? (
            <p className="rounded-xl border border-dashed border-slate-700/80 px-4 py-8 text-center text-sm text-slate-400">
              Alle Todos sind erledigt – öffne die Erledigt-Ansicht oben rechts.
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleActiveTodos.map((todo) => {
                const isExiting = animatingIds.has(todo.id);
                return (
                  <li
                    key={todo.id}
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
                      <input
                        type="checkbox"
                        checked={todo.done}
                        onChange={() => handleToggleTodo(todo)}
                        className="h-6 w-6 cursor-pointer rounded-lg border border-slate-600 bg-slate-900 transition duration-150 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 checked:border-slate-100 checked:bg-slate-100"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {completedTodos.length > 0 && (
          <button
            onClick={clearCompletedTodos}
            className="text-sm font-medium text-slate-400 transition hover:text-slate-100 disabled:cursor-not-allowed"
            disabled={clearCompleted.isPending}
          >
            {clearCompleted.isPending
              ? "Lösche erledigte…"
              : "Erledigte Todos entfernen"}
          </button>
        )}

        <form
          className="sticky bottom-0 flex items-center gap-3 border-t border-slate-800 pt-4 backdrop-blur"
          onSubmit={handleSubmit}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
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

      {showCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
          <section className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Erledigte Todos</h2>
              <button
                className="rounded-full border border-slate-600 p-1 text-slate-400 hover:text-slate-100"
                onClick={() => setShowCompleted(false)}
                aria-label="Ansicht schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {completedTodos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700/80 px-4 py-6 text-center text-sm text-slate-400">
                Keine erledigten Todos vorhanden.
              </p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {completedTodos.map((todo) => (
                  <li
                    key={todo.id}
                    className="flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-400 line-through"
                  >
                    <span>{todo.text}</span>
                    <input
                      type="checkbox"
                      checked
                      onChange={() => handleReopenTodo(todo)}
                      className="h-5 w-5 appearance-auto border-slate-600 bg-slate-900 text-slate-100 focus:ring-slate-200"
                    />
                  </li>
                ))}
              </ul>
            )}

            <button
              className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-900/50"
              onClick={clearCompletedTodos}
              disabled={completedTodos.length === 0 || clearCompleted.isPending}
            >
              {clearCompleted.isPending
                ? "Lösche erledigte…"
                : "Alle erledigten löschen"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
