import { useRef } from "react";
import type { PointerEvent } from "react";
import { UserRound } from "lucide-react";
import type { ListSummary } from "@/features/lists/hooks/use-lists";

const LONG_PRESS_MS = 500;

type ListPickerItemProps = {
  list: ListSummary;
  onSelect: () => void;
  onLongPress: () => void;
  isActive?: boolean;
};

export const ListPickerItem = ({ list, onSelect, onLongPress, isActive }: ListPickerItemProps) => {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = (event?: PointerEvent<HTMLButtonElement>) => {
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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (longPressTriggeredRef.current) {
      event.preventDefault();
      event.stopPropagation();
      longPressTriggeredRef.current = false;
      return;
    }
    onSelect();
  };

  return (
    <button
      type="button"
      className={`flex w-full items-start cursor-pointer justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm text-theme-text transition ${
        isActive ? "bg-theme-primary/10 hover:bg-theme-primary/15" : "hover:bg-theme-surface/80"
      }`}
      onClick={handleClick}
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
      <span className={`flex-1 text-left text-sm font-medium leading-tight line-clamp-2 wrap-break-word ${
        isActive ? "text-theme-primary" : "text-theme-text"
      }`}>
        {list.name}
      </span>
      {list.role !== "owner" && (
        <span
          className="text-theme-text-muted"
          title={list.role === "editor" ? "Editor" : "Viewer"}
          aria-label={`Rolle: ${list.role}`}
        >
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
