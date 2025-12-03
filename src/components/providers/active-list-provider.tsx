"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useLists, type ListSummary } from "@/hooks/use-lists";

type ActiveListContextValue = {
  lists: ListSummary[];
  activeList: ListSummary | null;
  setActiveListId: (id: string | null) => void;
  isLoadingLists: boolean;
  createList: ReturnType<typeof useLists>["createList"];
  renameList: ReturnType<typeof useLists>["renameList"];
  deleteList: ReturnType<typeof useLists>["deleteList"];
  leaveList: ReturnType<typeof useLists>["leaveList"];
};

const ActiveListContext = createContext<ActiveListContextValue | undefined>(undefined);

const ACTIVE_LIST_STORAGE_KEY = "clarydo-active-list-id";

export function ActiveListProvider({ children }: { children: ReactNode }) {
  const {
    lists,
    isPending: isLoadingLists,
    createList,
    renameList,
    deleteList,
    leaveList,
  } = useLists();
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ACTIVE_LIST_STORAGE_KEY);
    if (stored) {
      setActiveListId(stored);
    }
  }, []);

  // Persist selection
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeListId) {
      window.localStorage.setItem(ACTIVE_LIST_STORAGE_KEY, activeListId);
    } else {
      window.localStorage.removeItem(ACTIVE_LIST_STORAGE_KEY);
    }
  }, [activeListId]);

  // Ensure there is always a valid active list once data is loaded
  useEffect(() => {
    if (isLoadingLists) return;
    if (lists.length === 0) {
      setActiveListId(null);
      return;
    }
    if (!activeListId || !lists.some((list) => list.id === activeListId)) {
      setActiveListId(lists[0].id);
    }
  }, [lists, isLoadingLists, activeListId]);

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? null,
    [lists, activeListId],
  );

  const value = useMemo<ActiveListContextValue>(
    () => ({
      lists,
      activeList,
      setActiveListId,
      isLoadingLists,
      createList,
      renameList,
      deleteList,
      leaveList,
    }),
    [lists, activeList, isLoadingLists, createList, renameList, deleteList, leaveList],
  );

  return <ActiveListContext.Provider value={value}>{children}</ActiveListContext.Provider>;
}

export function useActiveList() {
  const context = useContext(ActiveListContext);
  if (!context) {
    throw new Error("useActiveList must be used within an ActiveListProvider");
  }
  return context;
}
