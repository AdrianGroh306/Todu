"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveList } from "@/features/shared/providers/active-list-provider";
import { useModalManager } from "@/features/shared/providers/modal-manager-provider";
import { usePollingTodos, type Todo } from "@/features/todos/hooks/use-polling-todos";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { useVisualViewport } from "@/features/shared/hooks/use-visual-viewport";
import { TodoHeader } from "./todo-header";
import { TodoInput } from "./todo-input";
import { TodoItem } from "./todo-item";
import { TodoActionModal } from "./todo-action-modal";
import { PendingInviteModal } from "@/features/lists/components/pending-invite-modal";

const EXIT_ANIMATION_MS = 280;

type TimerMap = Record<string, ReturnType<typeof setTimeout>>;

export const TodoList = () => {
  const [text, setText] = useState("");
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [actionTodo, setActionTodo] = useState<Todo | null>(null);
  const [editValue, setEditValue] = useState("");
  const animationTimers = useRef<TimerMap>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeList, isLoadingLists } = useActiveList();
  const { openModal } = useModalManager();
  useVisualViewport();

  const {
    todos,
    isPending,
    isError,
    createTodo,
    updateTodo,
    deleteTodo,
    invalidateTodos,
    activeUsers,
  } = usePollingTodos(activeList?.id ?? null);

  const hasActiveList = Boolean(activeList);

  const handleRefresh = async () => {
    await invalidateTodos();
  };

  const completedTodos = useMemo(() => todos.filter((t) => t.done), [todos]);
  const totalTodos = todos.length;
  const completedCount = completedTodos.length;

  const visibleTodos = useMemo(
    () => todos.filter((t) => !t.done || animatingIds.has(t.id)),
    [todos, animatingIds],
  );

  useEffect(() => {
    if (hasActiveList) return;
    setActionTodo(null);
    setEditValue("");
  }, [hasActiveList]);

  const completedButtonDisabled = !hasActiveList || completedCount === 0;

  const navigateToCompleted = () => {
    if (!hasActiveList) return;
    openModal("completedTodos");
  };

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
      // Don't invalidate here - the mutation's onSuccess already updates the cache
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
    <main className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden px-4 pt-4 pb-4 text-theme-text">
      <PendingInviteModal />
      <TodoHeader
        listName={activeList?.name ?? ""}
        completedCount={completedCount}
        totalCount={totalTodos}
        onShowCompleted={navigateToCompleted}
        showCompletedDisabled={completedButtonDisabled}
        activeUsers={activeUsers}
      />

      <section className="flex flex-1 min-h-0 flex-col gap-4 pt-4">
        <PullToRefresh
          onRefresh={handleRefresh}
          disabled={!hasActiveList || isPending}
          className="flex-1 min-h-0 overflow-y-auto overscroll-none rounded-2xl bg-theme-surface/80 px-4 py-2 backdrop-blur"
        >
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
            <ul>
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
        </PullToRefresh>
      </section>

      <TodoInput
        value={text}
        onChange={setText}
        onSubmit={handleSubmit}
        disabled={!hasActiveList}
        isCreating={createTodo.isPending}
        inputRef={inputRef}
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
