import { CheckCircle } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { UserAvatar } from "@/features/auth/components/user-avatar";
import { ListPicker } from "@/features/lists/components/list-picker";

type TodoHeaderProps = {
  listName: string;
  completedCount: number;
  totalCount: number;
  onShowCompleted: () => void;
  showCompletedDisabled: boolean;
};

export const TodoHeader = ({
  listName,
  completedCount,
  totalCount,
  onShowCompleted,
  showCompletedDisabled,
}: TodoHeaderProps) => {
  return (
    <header className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar size="md" />
          <ListPicker />
        </div>
        <button
          className={`flex items-center cursor-pointer gap-2 rounded-xl border-3 px-3 py-2 text-sm font-medium transition ${
            showCompletedDisabled
              ? "cursor-not-allowed border-theme-border/50 text-theme-text-muted/50"
              : "border-theme-border text-theme-text hover:border-theme-primary"
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
