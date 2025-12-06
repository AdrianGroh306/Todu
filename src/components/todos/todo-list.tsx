"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Plus, CheckCircle, Save } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Modal } from "@/components/ui/modal";
import { useActiveList } from "@/components/providers/active-list-provider";
import { useTodos, type Todo } from "@/hooks/use-todos";
import { useRealtimeTodos } from "@/hooks/use-realtime-todos";
import { UserAvatar } from "@/components/settings/user-avatar";
import { ListPicker } from "../lists/list-picker";

const EXIT_ANIMATION_MS = 280;
const LONG_PRESS_MS = 500;

type TimerMap = Record<string, ReturnType<typeof setTimeout>>;

export function TodoList() {
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

  const listStatusLabel = isLoadingLists
    ? "Liste wird geladen…"
    : activeList
      ? activeList.name
      : "Erstelle oder wähle eine Liste";
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UserAvatar size="md" />
            <ListPicker />
          </div>
          <button
            className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${completedButtonDisabled
              ? "cursor-not-allowed border-theme-border/50 text-theme-text-muted/50"
              : "border-theme-border text-theme-text hover:border-theme-primary"
              }`}
            onClick={() => setShowCompleted(true)}
            disabled={completedButtonDisabled}
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        </div>
        <ProgressBar value={completedCount} max={totalTodos} label="Todo-Fortschritt" />
      </header>

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
        <form
          className="sticky bottom-0 flex items-center gap-3 pt-3 backdrop-blur"
          onSubmit={handleSubmit}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={hasActiveList ? "Neues Todo hinzufügen" : "Liste auswählen, um Todos anzulegen"}
            className="flex-1 rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-base text-theme-text outline-none transition focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/40"
            autoFocus={hasActiveList}
            disabled={!hasActiveList}
          />
          <button
            type="submit"
            className="flex cursor-pointer h-12 w-12 items-center justify-center rounded-xl bg-theme-primary text-theme-bg transition hover:bg-theme-primary-hover"
            aria-label="Todo hinzufügen"
            disabled={!hasActiveList || !text.trim() || createTodo.isPending}
          >
            <Plus className=" h-5 w-5" />
          </button>
        </form>
      </section>

      <Modal
        open={Boolean(showCompleted && hasActiveList)}
        onClose={() => setShowCompleted(false)}
        title="Erledigte Todos"
        footer={
          <button
            className="rounded-xl bg-rose-500 cursor-pointer px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleClearCompleted}
            disabled={completedButtonDisabled || clearCompleted.isPending}
          >
            {clearCompleted.isPending ? "Lösche erledigte…" : "Alle erledigten löschen"}
          </button>
        }
      >
        {completedTodos.length === 0 ? (
          <EmptyState dashed>Keine erledigten Todos vorhanden.</EmptyState>
        ) : (
          <ul className="max-h-72 divide-y divide-theme-border/50 overflow-y-auto pr-1">
            {completedTodos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between px-4 py-3 text-sm text-theme-text-muted line-through"
              >
                <span>{todo.text}</span>
                <Checkbox visualSize="sm" checked onChange={() => handleReopenTodo(todo)} />
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal open={Boolean(actionTodo && hasActiveList)} onClose={closeActionMenu} title="Todo-Aktionen">
        {actionTodo && (
          <div className="space-y-4">
            <div className="flex flex-row gap-2">
              <input
                id="edit-todo-text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-theme-text outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/40"
              />
              <button
                type="button"
                aria-label="Änderungen speichern"
                className="flex items-center cursor-pointer justify-center rounded-xl bg-theme-primary text-theme-border transition hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50 h-auto w-12"
                onClick={handleEditSubmit}
                disabled={!editValue.trim() || updateTodo.isPending}
              >
                {updateTodo.isPending ? (
                  <span className="text-sm font-semibold">…</span>
                ) : (
                  <Save className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>

            <p className="text-xs flex justify-center text-theme-text-muted">oder</p>
            <div className="flex justify-center">
              <button
                type="button"
                className="rounded-xl bg-rose-500 cursor-pointer px-12 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleDeleteAction}
                disabled={deleteTodo.isPending}
              >
                {deleteTodo.isPending ? "Lösche…" : "Todo löschen"}
              </button>
            </div>

          </div>
        )}
      </Modal>
    </main>
  );
}

type TodoItemProps = {
  todo: Todo;
  isExiting: boolean;
  onToggle: () => void;
  onLongPress: () => void;
};

function TodoItem({ todo, isExiting, onToggle, onLongPress }: TodoItemProps) {
  const disabled = isExiting;
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = (event?: PointerEvent<HTMLLIElement>) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (longPressTriggeredRef.current) {
      event?.preventDefault();
      event?.stopPropagation();
      longPressTriggeredRef.current = false;
    }
  };

  const handlePointerDown = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
    longPressTriggeredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      pressTimerRef.current = null;
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const handleCheckboxChange = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onToggle();
  };

  return (
    <li
      className={`group flex items-center justify-between px-2 py-4 transition-all duration-200 ease-out ${isExiting ? "pointer-events-none translate-x-4 opacity-0" : "opacity-100"
        } ${!isExiting ? "hover:bg-theme-surface/40" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPress}
      onPointerLeave={() => clearLongPress()}
      onPointerCancel={clearLongPress}
      onContextMenu={(event) => {
        event.preventDefault();
        longPressTriggeredRef.current = true;
        onLongPress();
      }}
    >
      <label className="flex w-full cursor-pointer items-center gap-3">
        <span
          className={`flex-1 text-base transition-all duration-200 ${todo.done ? "text-theme-text-muted line-through" : "text-theme-text"
            }`}
        >
          {todo.text}
        </span>
        <Checkbox
          checked={todo.done}
          onChange={handleCheckboxChange}
          disabled={disabled}
          aria-disabled={disabled}
        />
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
      className={`rounded-xl px-4 py-8 text-center text-sm text-theme-text-muted ${dashed ? "border border-dashed border-theme-border/80" : ""
        }`}
    >
      {children}
    </p>
  );
}

function ErrorState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-rose-500/50 bg-rose-950/60 px-4 py-3 text-center text-sm text-rose-200">
      {children}
    </p>
  );
}
