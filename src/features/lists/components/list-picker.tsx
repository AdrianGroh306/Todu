"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { useActiveList } from "@/features/shared/providers/active-list-provider";
import type { ListSummary } from "@/features/lists/hooks/use-lists";
import { ListSelectionModal } from "./list-selection-modal";
import { ListActionsModal } from "./list-actions-modal";
import { ShareListModal } from "./share-list-modal";

export const ListPicker = () => {
  const {
    lists,
    activeList,
    setActiveListId,
    isLoadingLists,
    createList,
    renameList,
    deleteList,
    leaveList,
  } = useActiveList();

  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [actionList, setActionList] = useState<ListSummary | null>(null);
  const [shareList, setShareList] = useState<ListSummary | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectableLists = lists;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsSelectionOpen(false);
      }
    };

    if (isSelectionOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [isSelectionOpen]);

  const toggleOpen = () => {
    if (isLoadingLists && !activeList) return;
    setIsSelectionOpen((prev) => !prev);
  };

  const handleCreateList = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const created = await createList.mutateAsync({ name: trimmed });
      setIsSelectionOpen(false);
      setActiveListId(created.id);
    } catch (error) {
      console.error("Failed to create list", error);
    }
  };

  const handleListLongPress = (list: ListSummary) => {
    setIsSelectionOpen(false);
    setActionList(list);
  };

  const closeActionModal = () => {
    setActionList(null);
  };

  const handleRename = (newName: string) => {
    if (!actionList || actionList.role !== "owner") return;
    renameList.mutate(
      { id: actionList.id, name: newName },
      {
        onSuccess: closeActionModal,
      },
    );
  };

  const handleDelete = () => {
    if (!actionList || actionList.role !== "owner") return;
    const listIdToDelete = actionList.id;
    const deletingActive = listIdToDelete === activeList?.id;
    deleteList.mutate(listIdToDelete, {
      onSuccess: () => {
        closeActionModal();
        if (deletingActive) {
          const fallback = lists.find((list) => list.id !== listIdToDelete)?.id ?? null;
          setActiveListId(fallback);
        }
      },
    });
  };

  const handleLeave = () => {
    if (!actionList || actionList.role === "owner") return;
    const listIdToLeave = actionList.id;
    const leavingActive = listIdToLeave === activeList?.id;
    leaveList.mutate(listIdToLeave, {
      onSuccess: () => {
        closeActionModal();
        if (leavingActive) {
          const fallback = lists.find((list) => list.id !== listIdToLeave)?.id ?? null;
          setActiveListId(fallback);
        }
      },
    });
  };

  const handleShare = () => {
    if (!actionList) return;
    setShareList(actionList);
    closeActionModal();
  };

  const closeShareModal = () => {
    setShareList(null);
  };

  const triggerLabel = activeList?.name ?? (isLoadingLists ? "Listen laden…" : "Liste wählen");

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-xl cursor-pointer bg-theme-surface px-3 py-2 text-left text-sm font-medium text-theme-text transition hover:border-theme-border focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary/60 sm:w-auto"
        onClick={toggleOpen}
        aria-expanded={isSelectionOpen}
        aria-haspopup="listbox"
      >
        <ChevronsUpDown className="h-4 w-4 shrink-0" />
        <span className="max-w-56 text-left text-lg font-semibold leading-tight text-theme-text line-clamp-2 wrap-break-word sm:text-xl">
          {triggerLabel}
        </span>
      </button>

      <ListSelectionModal
        open={isSelectionOpen}
        onClose={() => setIsSelectionOpen(false)}
        selectableLists={selectableLists}
        activeList={activeList}
        isLoading={isLoadingLists}
        onSelectList={(listId) => {
          setActiveListId(listId);
          setIsSelectionOpen(false);
        }}
        onListLongPress={handleListLongPress}
        onCreateList={handleCreateList}
        isCreatingList={createList.isPending}
      />

      <ListActionsModal
        list={actionList}
        onClose={closeActionModal}
        onRename={handleRename}
        isRenaming={renameList.isPending}
        onDelete={handleDelete}
        isDeleting={deleteList.isPending}
        onLeave={handleLeave}
        isLeaving={leaveList.isPending}
        onShare={handleShare}
      />

      <ShareListModal list={shareList} onClose={closeShareModal} />
    </div>
  );
}
