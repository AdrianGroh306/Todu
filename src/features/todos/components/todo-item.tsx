import { useRef } from "react";
import type { PointerEvent } from "react";
import { Checkbox } from "@/components/checkbox";
import type { Todo } from "@/features/todos/hooks/use-polling-todos";

const LONG_PRESS_MS = 500;

type TodoItemProps = {
  todo: Todo;
  isExiting: boolean;
  onToggle: () => void;
  onLongPress: () => void;
};

export const TodoItem = ({ todo, isExiting, onToggle, onLongPress }: TodoItemProps) => {
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
      className={`group flex items-center justify-between px-4 py-3 transition-all duration-200 ease-out ${
        isExiting ? "pointer-events-none translate-x-4 opacity-0" : "opacity-100"
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
      <div className="flex w-full font-semibold items-center gap-3">
        <span
          className={`flex-1 text-base transition-all duration-200 ${
            todo.done ? "text-theme-text-muted line-through" : "text-theme-text"
          }`}
        >
          {todo.text}
        </span>
        <label className="p-1 -m-1 cursor-pointer">
          <Checkbox
            checked={todo.done}
            onChange={handleCheckboxChange}
            disabled={disabled}
            aria-disabled={disabled}
          />
        </label>
      </div>
    </li>
  );
}
