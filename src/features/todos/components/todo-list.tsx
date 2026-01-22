"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveList } from "@/features/shared/providers/active-list-provider";
import { usePollingTodos, type Todo } from "@/features/todos/hooks/use-polling-todos";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { useNotifications } from "@/features/shared/hooks/use-notifications";
import { useWebPush } from "@/features/shared/hooks/use-web-push";
import { useTodoChangeNotifications } from "@/features/todos/hooks/use-todo-change-notifications";
import { TodoHeader } from "./todo-header";
import { TodoInput } from "./todo-input";
import { TodoItem } from "./todo-item";
import { CompletedTodosModal } from "./completed-todos-modal";
import { TodoActionModal } from "./todo-action-modal";
import { NotificationBanner } from "./notification-banner";
import { PendingInviteModal } from "@/features/lists/components/pending-invite-modal";

const EXIT_ANIMATION_MS = 280;
const REMINDER_INTERVAL_MS = 15 * 60 * 1000;

type TimerMap = Record<string, ReturnType<typeof setTimeout>>;

export const TodoList = () => {
  const [text, setText] = useState("");
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState(false);
  const [actionTodo, setActionTodo] = useState<Todo | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);
  const animationTimers = useRef<TimerMap>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const lastReminderTimestampRef = useRef(0);
  const hasShownWelcomeNotificationRef = useRef(false);
  const { activeList, isLoadingLists } = useActiveList();
  const {
    isSupported: notificationsSupported,
    permission: notificationPermission,
    canNotify,
    sendNotification,
  } = useNotifications();

  const {
    isSupported: pushSupported,
    isSubscribed: isPushSubscribed,
    subscribe: subscribeToPush,
  } = useWebPush();

  const {
    todos,
    isPending,
    isError,
    createTodo,
    updateTodo,
    clearCompleted,
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
  const openTodosCount = totalTodos - completedCount;

  const visibleTodos = useMemo(
    () => todos.filter((t) => !t.done || animatingIds.has(t.id)),
    [todos, animatingIds],
  );

  useTodoChangeNotifications({
    todos,
    listId: activeList?.id ?? null,
    listName: activeList?.name ?? "",
    canNotify,
    sendNotification,
  });

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
      // Don't invalidate here - the mutation's onSuccess already updates the cache
    }, EXIT_ANIMATION_MS);
  };

  const handleEnableNotifications = async () => {
    if (isRequestingNotifications || notificationPermission === "granted") {
      return;
    }
    setIsRequestingNotifications(true);
    try {
      // Subscribe to push notifications (this also requests notification permission)
      if (pushSupported) {
        await subscribeToPush();
      }
    } finally {
      setIsRequestingNotifications(false);
    }
  };

  const reminderBody = (count: number) => {
    if (count <= 0) {
      return "Alles erledigt – gönn dir eine Pause!";
    }
    return count === 1 ? "Du hast noch eine offene Aufgabe." : `Du hast noch ${count} offene Aufgaben.`;
  };

  const handleSendTestNotification = async () => {
    if (isSendingTestNotification) {
      return;
    }
    setIsSendingTestNotification(true);
    try {
      // Send a real push notification via the server
      const response = await fetch("/api/test-push", { method: "POST" });
      if (!response.ok) {
        console.error("Test push failed:", await response.text());
      }
    } catch (error) {
      console.error("Test push error:", error);
    } finally {
      setIsSendingTestNotification(false);
    }
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

  useEffect(() => {
    if (!canNotify) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      if (openTodosCount <= 0) return;

      const now = Date.now();
      if (now - lastReminderTimestampRef.current < REMINDER_INTERVAL_MS) {
        return;
      }
      lastReminderTimestampRef.current = now;
      void sendNotification("Clarydo – offenes Todo", {
        body: reminderBody(openTodosCount),
        tag: "clarydo-reminder",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canNotify, openTodosCount, sendNotification]);

  useEffect(() => {
    if (!canNotify || hasShownWelcomeNotificationRef.current) {
      return;
    }
    hasShownWelcomeNotificationRef.current = true;
    void sendNotification("Clarydo Benachrichtigungen aktiv", {
      body: reminderBody(openTodosCount),
      tag: "clarydo-welcome",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
  }, [canNotify, openTodosCount, sendNotification]);

  return (
    <main className="mx-auto flex h-screen max-w-3xl flex-col overflow-hidden px-4 pt-4 text-theme-text">
      <PendingInviteModal />
      <TodoHeader
        listName={activeList?.name ?? ""}
        completedCount={completedCount}
        totalCount={totalTodos}
        onShowCompleted={() => setShowCompleted(true)}
        showCompletedDisabled={completedButtonDisabled}
        activeUsers={activeUsers}
      />

      <section className="flex flex-1 min-h-0 flex-col gap-4">
        {notificationsSupported ? (
          <NotificationBanner
            variant={
              notificationPermission === "granted"
                ? "enabled"
                : notificationPermission === "denied"
                  ? "blocked"
                  : "prompt"
            }
            onEnable={notificationPermission === "default" ? handleEnableNotifications : undefined}
            onTest={notificationPermission === "granted" ? handleSendTestNotification : undefined}
            isRequesting={isRequestingNotifications}
            isTesting={isSendingTestNotification}
            pendingTodos={openTodosCount}
          />
        ) : null}
        <PullToRefresh
          onRefresh={handleRefresh}
          disabled={!hasActiveList || isPending}
          className="rounded-2xl bg-theme-surface/80 p-6 backdrop-blur"
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
        </PullToRefresh>
        <TodoInput
          value={text}
          onChange={setText}
          onSubmit={handleSubmit}
          disabled={!hasActiveList}
          isCreating={createTodo.isPending}
          inputRef={inputRef}
        />
      </section>

      {showCompleted && hasActiveList ? (
        <CompletedTodosModal
          open
          onClose={() => setShowCompleted(false)}
          completedTodos={completedTodos}
          onReopenTodo={handleReopenTodo}
          onClearCompleted={handleClearCompleted}
          isClearing={clearCompleted.isPending}
        />
      ) : null}

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
