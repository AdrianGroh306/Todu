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
  const [newListName, setNewListName] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  const handleClose = () => {
    setNewListName("");
    onClose();
  };

  const handleCreateList = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed || isCreatingList) return;
    try {
      await onCreateList(trimmed);
      setNewListName("");
    } catch (error) {
      console.error("Failed to create list", error);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    // iOS keyboard fix: reset scroll when input is focused
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
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
            <p className="py-2 text-sm text-theme-text-muted">Keine Listen.</p>
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
        <form
          className="flex shrink-0 items-center gap-2 py-4"
          onSubmit={handleCreateList}
        >
          <input
            type="text"
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="flex-1 rounded-xl border border-theme-border bg-theme-surface/80 px-4 py-3 text-base text-theme-text outline-none transition focus:border-theme-primary focus:ring-2 focus:ring-theme-primary/40"
            maxLength={MAX_LIST_NAME_LENGTH}
            placeholder="Neue Liste hinzufügen"
          />
          <button
            type="submit"
            className="flex h-13 w-13 items-center justify-center rounded-xl bg-theme-primary text-theme-bg transition hover:bg-theme-primary-hover cursor-pointer disabled:opacity-60"
            aria-label="Liste hinzufügen"
            disabled={!newListName.trim() || isCreatingList}
          >
            {isCreatingList ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
};
