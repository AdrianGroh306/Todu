import { Save } from "lucide-react";
import { Modal } from "@/components/modal";
import { Spinner } from "@/components/spinner";
import type { Todo } from "@/features/todos/hooks/use-polling-todos";

type TodoActionModalProps = {
  open: boolean;
  onClose: () => void;
  todo: Todo | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
};

export const TodoActionModal = ({
  open,
  onClose,
  todo,
  editValue,
  onEditValueChange,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: TodoActionModalProps) => {
  if (!todo) return null;

  const isSaveDisabled =
    !editValue.trim() || editValue.trim() === todo.text.trim() || isSaving;

  return (
    <Modal open={open} onClose={onClose} title="Todo-Aktionen">
      <div className="space-y-4">
        <div className="flex flex-row gap-2">
          <input
            id="edit-todo-text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="flex-1 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-theme-text outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/40"
          />
          <button
            type="button"
            aria-label="Änderungen speichern"
            className="flex items-center cursor-pointer justify-center rounded-xl bg-theme-primary text-theme-bg transition hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50 h-auto w-12"
            onClick={onSave}
            disabled={isSaveDisabled}
          >
            {isSaving ? (
              <Spinner size="sm" className="border-theme-bg" />
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
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner size="sm" className="border-white mx-auto" /> : "Todo löschen"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
