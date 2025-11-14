"use client";

import { useEffect, useMemo, useState } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
};

const STORAGE_KEY = "clarydo::todos";

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Failed to parse todos from storage", error);
      return [];
    }
  });
  const [text, setText] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const remaining = useMemo(
    () => todos.filter((todo) => !todo.done).length,
    [todos],
  );

  const addTodo = () => {
    if (!text.trim()) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text: text.trim(), done: false },
      ...prev,
    ]);
    setText("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((todo) => !todo.done));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addTodo();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-12 text-slate-900">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
          Clarydo
        </p>
        <h1 className="text-4xl font-semibold text-slate-900">
          Deine einfache Todo-Liste
        </h1>
        <p className="text-sm text-slate-500">
          {remaining} Aufgaben offen · {todos.length} gesamt
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={handleSubmit}
        >
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Neue Aufgabe hinzufügen"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-3 text-base font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={!text.trim()}
          >
            Speichern
          </button>
        </form>

        <div className="mt-6 space-y-2">
          {todos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              Noch keine Einträge – starte oben mit deiner ersten Aufgabe.
            </p>
          ) : (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => toggleTodo(todo.id)}
                      className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span
                      className={`text-base ${
                        todo.done
                          ? "text-slate-400 line-through"
                          : "text-slate-900"
                      }`}
                    >
                      {todo.text}
                    </span>
                  </label>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-xs font-medium text-slate-400 transition hover:text-rose-500"
                    aria-label="Aufgabe löschen"
                  >
                    Entfernen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {todos.some((todo) => todo.done) && (
          <button
            onClick={clearCompleted}
            className="mt-6 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Erledigte Aufgaben entfernen
          </button>
        )}
      </section>
    </main>
  );
}
