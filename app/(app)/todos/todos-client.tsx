"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";

type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

async function jsonFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
}

export function TodosClient() {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const {
    data: todos = [],
    isPending,
    isError,
  } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => jsonFetch<Todo[]>("/api/todos"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { text: string }) =>
      jsonFetch<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      jsonFetch<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ done }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/todos/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const clearCompletedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => jsonFetch(`/api/todos/${id}`, { method: "DELETE" })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const remaining = useMemo(
    () => todos.filter((todo) => !todo.done).length,
    [todos],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    createMutation.mutate({ text: text.trim() });
  };

  const clearCompleted = () => {
    const completedIds = todos.filter((todo) => todo.done).map((todo) => todo.id);
    if (completedIds.length === 0) return;
    clearCompletedMutation.mutate(completedIds);
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
            disabled={!text.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? "Speichern…" : "Speichern"}
          </button>
        </form>

        <div className="mt-6 space-y-2">
          {isPending ? (
            <p className="text-center text-sm text-slate-500">Lade Aufgaben…</p>
          ) : isError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              Fehler beim Laden der Aufgaben.
            </p>
          ) : todos.length === 0 ? (
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
                      onChange={() =>
                        updateMutation.mutate({ id: todo.id, done: !todo.done })
                      }
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
                    onClick={() => deleteMutation.mutate(todo.id)}
                    className="text-xs font-medium text-slate-400 transition hover:text-rose-500"
                    aria-label="Aufgabe löschen"
                  >
                    {deleteMutation.isPending ? "…" : "Entfernen"}
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
            disabled={clearCompletedMutation.isPending}
          >
            {clearCompletedMutation.isPending
              ? "Lösche erledigte…"
              : "Erledigte Aufgaben entfernen"}
          </button>
        )}
      </section>
    </main>
  );
}
