"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLists, type ListSummary } from "@/features/lists/hooks/use-lists";
import { ACTIVE_LIST_STORAGE_KEY } from "@/features/shared/constants/storage";
import { postToServiceWorker } from "@/features/shared/service-worker";

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

type ActiveListProviderProps = {
  children: ReactNode;
  initialActiveListId?: string | null;
};

export const ActiveListProvider = ({ 
  children, 
  initialActiveListId 
}: ActiveListProviderProps) => {
  const {
    lists,
    isPending: isLoadingLists,
    createList,
    renameList,
    deleteList,
    leaveList,
  } = useLists();
  const [activeListId, setActiveListIdState] = useState<string | null>(initialActiveListId || null);
  // Read before the persist effect overwrites it: the HTML may be a cached snapshot with an older selection
  const [storedAtMount] = useState(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(ACTIVE_LIST_STORAGE_KEY),
  );
  const userHasSelectedRef = useRef(false);
  const hasPersistedRef = useRef(false);

  const setActiveListId = useCallback((id: string | null) => {
    userHasSelectedRef.current = true;
    setActiveListIdState(id);
  }, []);

  // Restore the last selection once its list is known (it may only arrive with the persisted cache)
  useEffect(() => {
    if (userHasSelectedRef.current || !storedAtMount || storedAtMount === activeListId) return;
    if (lists.some((list) => list.id === storedAtMount)) {
      userHasSelectedRef.current = true;
      setActiveListIdState(storedAtMount);
    }
  }, [lists, storedAtMount, activeListId]);

  // Persist selection
  useEffect(() => {
    if (activeListId) {
      window.localStorage.setItem(ACTIVE_LIST_STORAGE_KEY, activeListId);
      document.cookie = `${ACTIVE_LIST_STORAGE_KEY}=${activeListId}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      window.localStorage.removeItem(ACTIVE_LIST_STORAGE_KEY);
      document.cookie = `${ACTIVE_LIST_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    }

    // Keep the cached app shell on the selected list
    if (hasPersistedRef.current) {
      postToServiceWorker({ type: "REFRESH_SHELL" });
    }
    hasPersistedRef.current = true;
  }, [activeListId]);

  // Ensure there is always a valid active list once data is loaded
  useEffect(() => {
    if (isLoadingLists) return;
    if (lists.length === 0) {
      setActiveListIdState(null);
      return;
    }
    if (!activeListId || !lists.some((list) => list.id === activeListId)) {
      setActiveListIdState(lists[0].id);
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
    [lists, activeList, setActiveListId, isLoadingLists, createList, renameList, deleteList, leaveList],
  );

  return <ActiveListContext.Provider value={value}>{children}</ActiveListContext.Provider>;
}

export const useActiveList = () => {
  const context = useContext(ActiveListContext);
  if (!context) {
    throw new Error("useActiveList must be used within an ActiveListProvider");
  }
  return context;
}
