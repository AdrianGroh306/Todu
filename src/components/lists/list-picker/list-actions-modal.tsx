import { useEffect, useState } from "react";
import { LogOut, Save, Share2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { ListSummary } from "@/hooks/use-lists";

const MAX_LIST_NAME_LENGTH = 40;

type ListActionsModalProps = {
  list: ListSummary | null;
  onClose: () => void;
  onRename: (newName: string) => void;
  isRenaming: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  onLeave: () => void;
  isLeaving: boolean;
  onShare: () => void;
};

export function ListActionsModal({
  list,
  onClose,
  onRename,
  isRenaming,
  onDelete,
  isDeleting,
  onLeave,
  isLeaving,
  onShare,
}: ListActionsModalProps) {
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    setRenameValue(list?.name ?? "");
  }, [list?.id, list?.name]);

  const isOwner = list?.role === "owner";
  const trimmedRenameValue = renameValue.trim();
  const renameDisabled =
    !isOwner || !trimmedRenameValue || trimmedRenameValue === list?.name || isRenaming;

  const handleRenameSubmit = () => {
    if (!list || !isOwner) return;
    if (!trimmedRenameValue) {
      onClose();
      return;
    }
    if (trimmedRenameValue === list.name) {
      onClose();
      return;
    }
    onRename(trimmedRenameValue);
  };

  return (
    <Modal
      open={Boolean(list)}
      onClose={onClose}
      title="Listen-Aktionen"
      titleActions={
        isOwner ? (
          <button
            type="button"
            className="flex items-center justify-start gap-2 cursor-pointer rounded-xl bg-theme-surface px-4 py-2 text-sm font-semibold"
            onClick={onShare}
            aria-label="Liste teilen"
          >
            <Share2 className="h-4 w-4 text-theme-text-muted hover:text-theme-text" />
          </button>
        ) : null
      }
    >
      {list && (
        <div className="space-y-4">
          {isOwner ? (
            <>
              <div className="flex flex-row gap-2">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  className="flex-1 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-theme-text outline-none focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/40"
                  maxLength={MAX_LIST_NAME_LENGTH}
                />
                <button
                  type="button"
                  aria-label="Änderungen speichern"
                  className="flex h-auto w-12 cursor-pointer items-center justify-center rounded-xl bg-theme-primary text-theme-border transition hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleRenameSubmit}
                  disabled={renameDisabled}
                >
                  {isRenaming ? <span className="text-sm font-semibold">…</span> : <Save className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              <p className="flex justify-center text-xs text-theme-text-muted">oder</p>
              <div className="flex justify-center">
                <button
                  type="button"
                  className="flex items-center gap-2 cursor-pointer rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    "Lösche…"
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Liste löschen
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-theme-text-muted">
                Du bist als {list.role} eingeladen. Du kannst diese Liste jederzeit verlassen.
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  className="flex items-center gap-2 cursor-pointer rounded-xl bg-theme-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={onLeave}
                  disabled={isLeaving}
                >
                  {isLeaving ? (
                    "Verlasse…"
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      Liste verlassen
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
