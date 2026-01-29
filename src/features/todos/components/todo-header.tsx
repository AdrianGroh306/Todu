import { CheckCircle } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { UserAvatar } from "@/features/auth/components/user-avatar";
import { PresenceAvatars } from "./presence-avatars";
import type { PresenceUser } from "@/features/todos/hooks/use-polling-todos";
import { ListPicker } from "@/features/lists/components/list-picker";

type TodoHeaderProps = {
  listName: string;
  completedCount: number;
  totalCount: number;
  onShowCompleted: () => void;
  showCompletedDisabled: boolean;
  activeUsers?: PresenceUser[];
};

export const TodoHeader = ({
  listName,
  completedCount,
  totalCount,
  onShowCompleted,
  showCompletedDisabled,
  activeUsers = [],
}: TodoHeaderProps) => {
  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar size="md">
            {activeUsers.length > 0 ? (
              <PresenceAvatars
                users={activeUsers}
                maxVisible={2}
                variant="inline"
                size="md"
                className="pointer-events-none"
              />
            ) : null}
          </UserAvatar>
          <ListPicker />
        </div>
        <button
          className={`flex items-center bg-theme-surface cursor-pointer gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
            showCompletedDisabled
              ? "cursor-not-allowed border-theme-border/50 text-theme-text-muted/50"
              : "text-theme-text hover:border-theme-primary"
          }`}
          onClick={onShowCompleted}
          disabled={showCompletedDisabled}
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      </div>
      <ProgressBar value={completedCount} max={totalCount} label="Todo-Fortschritt" />
    </header>
  );
}
