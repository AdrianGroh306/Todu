import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Modal } from "@/components/modal";
import type { ListSummary } from "@/features/lists/hooks/use-lists";
import { ListPickerItem } from "./list-picker-item";

const MAX_LIST_NAME_LENGTH = 25;

type ListSelectionModalProps = {
  open: boolean;
  onClose: () => void;
  selectableLists: ListSummary[];
  isLoading: boolean;
  onSelectList: (listId: string) => void;
  onListLongPress: (list: ListSummary) => void;
  onCreateList: (name: string) => Promise<void>;
  isCreatingList: boolean;
};

export function ListSelectionModal({
  open,
  onClose,
  selectableLists,
  isLoading,
  onSelectList,
  onListLongPress,
  onCreateList,
  isCreatingList,
}: ListSelectionModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");

  const handleClose = () => {
    setShowCreateForm(false);
    setNewListName("");
    onClose();
  };

  const handleCreateList = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    try {
      await onCreateList(trimmed);
      setNewListName("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create list", error);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Weitere Listen">
      <div className="space-y-4">
        <div className="rounded-2xl bg-theme-surface/50 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-theme-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Listen werden geladen…
            </div>
          ) : selectableLists.length === 0 ? (
            <p className="py-2 text-sm text-theme-text-muted">
              Keine weiteren Listen – nutze unten den Button, um eine neue Liste anzulegen.
            </p>
          ) : (
            <ul className="max-h-56 divide-y divide-theme-border/50 overflow-y-auto pr-1">
              {selectableLists.map((list) => (
                <li key={list.id}>
                  <ListPickerItem
                    list={list}
                    onSelect={() => {
                      onSelectList(list.id);
                      handleClose();
                    }}
                    onLongPress={() => {
                      handleClose();
                      onListLongPress(list);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl bg-theme-surface/40 p-4">
          {showCreateForm ? (
            <form className="space-y-3" onSubmit={handleCreateList}>
              <input
                type="text"
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                className="w-full rounded-xl border border-theme-border bg-theme-bg px-4 py-3 text-sm text-theme-text outline-none focus:border-theme-primary"
                maxLength={MAX_LIST_NAME_LENGTH}
                placeholder="Neue Liste"
                autoFocus
              />
              <div className="text-right text-xs text-theme-text-muted">
                {newListName.length}/{MAX_LIST_NAME_LENGTH}
              </div>
              <div className="flex items-center justify-end gap-2 text-sm">
                <button
                  type="button"
                  className="rounded-xl border border-transparent px-3 py-1.5 text-theme-text-muted transition hover:text-theme-text cursor-pointer"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewListName("");
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex items-center cursor-pointer gap-1 rounded-xl bg-theme-primary px-4 py-2 font-semibold text-theme-border transition hover:bg-theme-primary-hover"
                  disabled={!newListName.trim() || isCreatingList}
                >
                  {isCreatingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Speichern
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl border border-dashed border-theme-border/60 px-4 py-3 text-sm font-medium text-theme-text transition hover:border-theme-border"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4" />
              Neue Liste
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
