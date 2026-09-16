import { memo, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Checkbox } from "@/components/checkbox";
import type { Todo } from "@/features/todos/hooks/use-polling-todos";

const LONG_PRESS_MS = 500;

type TodoItemProps = {
  todo: Todo;
  isExiting: boolean;
  onToggle: (todo: Todo) => void;
  onLongPress: (todo: Todo) => void;
};

export const TodoItem = memo(function TodoItem({ todo, isExiting, onToggle, onLongPress }: TodoItemProps) {
  // Only todos created on this device animate in; captured once so the class survives the id swap
  const [animateEnter] = useState(() => todo.id.startsWith("optimistic-"));
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = (event?: PointerEvent<HTMLDivElement>) => {
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
      onLongPress(todo);
    }, LONG_PRESS_MS);
  };

  const handleCheckboxChange = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    onToggle(todo);
  };

  return (
    <li className={`todo-item ${animateEnter ? "todo-enter" : ""} ${isExiting ? "todo-exit" : ""}`}>
      <div className="todo-clip">
        <div className="todo-row">
          <div
            className="press-row flex w-full items-center gap-3 px-4 py-3 font-semibold"
            onPointerDown={handlePointerDown}
            onPointerUp={clearLongPress}
            onPointerLeave={() => clearLongPress()}
            onPointerCancel={clearLongPress}
            onContextMenu={(event) => {
              event.preventDefault();
              longPressTriggeredRef.current = true;
              onLongPress(todo);
            }}
          >
            <span className={`todo-text flex-1 text-base ${todo.done ? "is-done" : ""}`}>
              <span className="todo-strike">{todo.text}</span>
            </span>
            <label className="p-1 -m-1 cursor-pointer">
              <Checkbox
                checked={todo.done}
                onChange={handleCheckboxChange}
                disabled={isExiting}
                aria-disabled={isExiting}
              />
            </label>
          </div>
        </div>
      </div>
    </li>
  );
});
