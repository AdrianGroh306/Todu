import { useEffect, useRef } from "react";
import type { Todo } from "./use-polling-todos";

type Change =
  | { type: "created"; todo: Todo }
  | { type: "deleted"; todo: Todo }
  | { type: "completed"; todo: Todo }
  | { type: "reopened"; todo: Todo }
  | { type: "edited"; todo: Todo };

type UseTodoChangeNotificationsParams = {
  todos: Todo[];
  listId: string | null;
  listName: string;
  canNotify: boolean;
  sendNotification: (title: string, options?: NotificationOptions) => Promise<boolean>;
};

const findChanges = (previous: Todo[], current: Todo[]): Change[] => {
  const changes: Change[] = [];
  const previousMap = new Map(previous.map((todo) => [todo.id, todo]));
  const currentMap = new Map(current.map((todo) => [todo.id, todo]));

  current.forEach((todo) => {
    const before = previousMap.get(todo.id);
    if (!before) {
      changes.push({ type: "created", todo });
      return;
    }
    if (before.done !== todo.done) {
      changes.push({ type: todo.done ? "completed" : "reopened", todo });
      return;
    }
    if (before.text !== todo.text) {
      changes.push({ type: "edited", todo });
    }
  });

  previous.forEach((todo) => {
    if (!currentMap.has(todo.id)) {
      changes.push({ type: "deleted", todo });
    }
  });

  return changes;
};

const buildMessage = (changes: Change[], listName: string) => {
  if (changes.length === 0) return null;

  const change = changes[0];
  const listLabel = listName || "deiner Liste";

  if (changes.length === 1) {
    switch (change.type) {
      case "created":
        return `"${change.todo.text}" wurde hinzugefügt.`;
      case "deleted":
        return `"${change.todo.text}" wurde gelöscht.`;
      case "completed":
        return `"${change.todo.text}" wurde abgehakt.`;
      case "reopened":
        return `"${change.todo.text}" wurde erneut geöffnet.`;
      case "edited":
        return `"${change.todo.text}" wurde bearbeitet.`;
      default:
        return `Die Liste "${listLabel}" wurde aktualisiert.`;
    }
  }

  return `${changes.length} Änderungen in "${listLabel}".`;
};

const isDocumentHidden = () =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

export const useTodoChangeNotifications = ({
  todos,
  listId,
  listName,
  canNotify,
  sendNotification,
}: UseTodoChangeNotificationsParams) => {
  const previousRef = useRef<Todo[] | null>(null);

  useEffect(() => {
    if (!listId || !canNotify) {
      previousRef.current = todos;
      return;
    }

    const previous = previousRef.current;
    previousRef.current = todos;

    if (!previous || !isDocumentHidden()) {
      return;
    }

    const changes = findChanges(previous, todos);
    const message = buildMessage(changes, listName);
    if (!message) return;

    void sendNotification("Liste wurde aktualisiert", {
      body: message,
      tag: `list-updates-${listId}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
  }, [todos, canNotify, listId, listName, sendNotification]);
};
