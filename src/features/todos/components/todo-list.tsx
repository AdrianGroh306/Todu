"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveList } from "@/features/shared/providers/active-list-provider";
import { useTodos, type Todo } from "@/features/todos/hooks/use-todos";
import { useRealtimeTodos } from "@/features/todos/hooks/use-realtime-todos";
import { TodoHeader } from "./todo-header";
import { TodoInput } from "./todo-input";
import { TodoItem } from "./todo-item";
import { CompletedTodosModal } from "./completed-todos-modal";
import { TodoActionModal } from "./todo-action-modal";

const EXIT_ANIMATION_MS = 280;

type TimerMap = Record<string, ReturnType<typeof setTimeout>>;

export const TodoList = () => {
  const [text, setText] = useState("");
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);
  const [actionTodo, setActionTodo] = useState<Todo | null>(null);
  const [editValue, setEditValue] = useState("");
  const animationTimers = useRef<TimerMap>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeList, isLoadingLists } = useActiveList();

  const {
    todos,
    isPending,
    isError,
    createTodo,
    updateTodo,
    clearCompleted,
    deleteTodo,
    invalidateTodos,
  } = useTodos(activeList?.id ?? null);

  // Set up real-time subscription for todos
  useRealtimeTodos(activeList?.id ?? null);

  const hasActiveList = Boolean(activeList);

  const completedTodos = useMemo(() => todos.filter((t) => t.done), [todos]);
  const totalTodos = todos.length;
  const completedCount = completedTodos.length;

  const visibleTodos = useMemo(
    () => todos.filter((t) => !t.done || animatingIds.has(t.id)),
    [todos, animatingIds],
  );

  useEffect(() => {
    if (hasActiveList) return;
    setShowCompleted(false);
    setActionTodo(null);
    setEditValue("");
  }, [hasActiveList]);

  const completedButtonDisabled = !hasActiveList || completedTodos.length === 0;

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
    if (animatingIds.has(todo.id)) {
      return;
    }
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

  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (!trimmedText || !hasActiveList) return;

    setText("");
    inputRef.current?.focus();
    createTodo.mutate(
      { text: trimmedText },
      {
        onError: () => {
          setText(trimmedText);
          inputRef.current?.focus();
        },
      },
    );
  };

  const handleClearCompleted = () => {
    if (!hasActiveList || completedTodos.length === 0) return;
    clearCompleted.mutate(completedTodos.map((t) => t.id));
  };

  const openActionMenu = (todo: Todo) => {
    setActionTodo(todo);
    setEditValue(todo.text);
  };

  const closeActionMenu = () => {
    setActionTodo(null);
    setEditValue("");
  };

  const handleDeleteAction = () => {
    if (!actionTodo || !hasActiveList) return;
    deleteTodo.mutate(actionTodo.id, {
      onSettled: closeActionMenu,
    });
  };

  const handleEditSubmit = () => {
    if (!actionTodo || !hasActiveList) return;
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === actionTodo.text) {
      closeActionMenu();
      return;
    }
    updateTodo.mutate(
      { id: actionTodo.id, text: trimmed },
      {
        onSuccess: () => closeActionMenu(),
        onError: () => setEditValue(actionTodo.text),
      },
    );
  };

  useEffect(() => {
    const timers = animationTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  return (
    <main className="mx-auto flex h-screen max-w-3xl flex-col overflow-hidden px-4 pt-4 text-theme-text">
      <TodoHeader
        listName={activeList?.name ?? ""}
        completedCount={completedCount}
        totalCount={totalTodos}
        onShowCompleted={() => setShowCompleted(true)}
        showCompletedDisabled={completedButtonDisabled}
      />

      <section className="flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl p-6 backdrop-blur">
        <div className="flex-1 overflow-y-auto pr-1">
          {isLoadingLists ? (
            <EmptyState>Listen werden geladen…</EmptyState>
          ) : !hasActiveList ? (
            <EmptyState dashed>
              Wähle oben eine Liste aus oder lege eine neue Liste an, um zu starten.
            </EmptyState>
          ) : isPending ? (
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
            <ul className="divide-y divide-theme-border/50">
              {visibleTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isExiting={animatingIds.has(todo.id)}
                  onToggle={() => handleToggleTodo(todo)}
                  onLongPress={() => openActionMenu(todo)}
                />
              ))}
            </ul>
          )}
        </div>
        <TodoInput
          value={text}
          onChange={setText}
          onSubmit={handleSubmit}
          disabled={!hasActiveList}
          isCreating={createTodo.isPending}
          inputRef={inputRef}
        />
      </section>

      <CompletedTodosModal
        open={showCompleted && hasActiveList}
        onClose={() => setShowCompleted(false)}
        completedTodos={completedTodos}
        onReopenTodo={handleReopenTodo}
        onClearCompleted={handleClearCompleted}
        isClearing={clearCompleted.isPending}
      />

      <TodoActionModal
        open={Boolean(actionTodo && hasActiveList)}
        onClose={closeActionMenu}
        todo={actionTodo}
        editValue={editValue}
        onEditValueChange={setEditValue}
        onSave={handleEditSubmit}
        onDelete={handleDeleteAction}
        isSaving={updateTodo.isPending}
        isDeleting={deleteTodo.isPending}
      />
    </main>
  );
};

type EmptyStateProps = {
  children: React.ReactNode;
  dashed?: boolean;
};

const EmptyState = ({ children, dashed }: EmptyStateProps) => {
  return (
    <p
      className={`rounded-xl px-4 py-8 text-center text-sm text-theme-text-muted ${
        dashed ? "border border-dashed border-theme-border/80" : ""
      }`}
    >
      {children}
    </p>
  );
};

const ErrorState = ({ children }: { children: React.ReactNode }) => {
  return (
    <p className="rounded-xl border border-rose-500/50 bg-rose-950/60 px-4 py-3 text-center text-sm text-rose-200">
      {children}
    </p>
  );
};
