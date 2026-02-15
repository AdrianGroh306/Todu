"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jsonFetch } from "@/lib/json-fetch";

export type ListSummary = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  role: "owner" | "editor" | "viewer";
};

const listsQueryKey = ["lists"] as const;

export const useLists = () => {
  const queryClient = useQueryClient();

  const {
    data: lists = [],
    isPending,
    isError,
  } = useQuery<ListSummary[]>({
    queryKey: listsQueryKey,
    queryFn: () => jsonFetch<ListSummary[]>("/api/lists"),
    staleTime: 60 * 1000, // Consider fresh for 1 minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always check on mount (uses staleTime to decide if fetch needed)
  });

  const createList = useMutation({
    mutationFn: (payload: { name: string }) =>
      jsonFetch<ListSummary>("/api/lists", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (newList) => {
      // Sofort zum Cache hinzufügen damit setActiveListId funktioniert
      queryClient.setQueryData<ListSummary[]>(listsQueryKey, (old) =>
        old ? [...old, newList] : [newList]
      );
    },
  });

  const renameList = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      jsonFetch<ListSummary>(`/api/lists/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryKey });
    },
  });

  const deleteList = useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/lists/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryKey });
    },
  });

  const leaveList = useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/list-members/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryKey });
    },
  });

  return { lists, isPending, isError, createList, renameList, deleteList, leaveList };
}
