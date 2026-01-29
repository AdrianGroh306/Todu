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
  activeList: ListSummary | null;
  isLoading: boolean;
  onSelectList: (listId: string) => void;
  onListLongPress: (list: ListSummary) => void;
  onCreateList: (name: string) => Promise<void>;
  isCreatingList: boolean;
};

export const ListSelectionModal = ({
  open,
  onClose,
  selectableLists,
  activeList,
  isLoading,
  onSelectList,
  onListLongPress,
  onCreateList,
  isCreatingList,
}: ListSelectionModalProps) => {
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

  const sortedLists = [
    ...(activeList ? [activeList] : []),
    ...selectableLists.filter((list) => list.id !== activeList?.id),
  ];

  return (
    <Modal open={open} onClose={handleClose} title="Meine Listen" fullscreen>
      <div className="flex h-full flex-col gap-4">
        <div className="flex-1 min-h-0 rounded-2xl bg-theme-surface/50 p-3">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-theme-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Listen werden geladen…
            </div>
          ) : sortedLists.length === 0 ? (
            <p className="py-2 text-sm text-theme-text-muted">
              Keine Listen verfügbar.
            </p>
          ) : (
            <ul className="h-full divide-y divide-theme-border/50 overflow-y-auto pr-1">
              {sortedLists.map((list) => (
                <li key={list.id}>
                  <ListPickerItem
                    list={list}
                    isActive={list.id === activeList?.id}
                    onSelect={() => {
                      if (list.id !== activeList?.id) {
                        onSelectList(list.id);
                      }
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
        <div className="rounded-2xl p-4">
          {showCreateForm ? (
            <form className="space-y-4" onSubmit={handleCreateList}>
              <input
                type="text"
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                className="w-full rounded-2xl border border-theme-border bg-theme-surface px-4 py-4 text-sm text-theme-text outline-none focus:border-theme-primary"
                maxLength={MAX_LIST_NAME_LENGTH}
                placeholder="Name der neuen Liste"
                autoFocus
              />
              <div className="text-right text-xs text-theme-text-muted">
                {newListName.length}/{MAX_LIST_NAME_LENGTH}
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  className="rounded-full border border-theme-border px-5 py-2 text-sm font-semibold text-theme-text transition hover:border-theme-primary hover:text-theme-primary cursor-pointer"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewListName("");
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex items-center cursor-pointer gap-2 rounded-full bg-theme-primary px-5 py-2 text-sm font-semibold text-theme-bg transition hover:bg-theme-primary-hover disabled:opacity-60"
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
              className="mx-auto flex items-center gap-2 rounded-full bg-theme-primary px-5 py-3 text-sm font-semibold text-theme-bg transition hover:bg-theme-primary-hover"
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
