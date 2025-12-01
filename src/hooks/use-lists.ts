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

export function useLists() {
  const queryClient = useQueryClient();

  const {
    data: lists = [],
    isPending,
    isError,
  } = useQuery<ListSummary[]>({
    queryKey: listsQueryKey,
    queryFn: () => jsonFetch<ListSummary[]>("/api/lists"),
  });

  const createList = useMutation({
    mutationFn: (payload: { name: string }) =>
      jsonFetch<ListSummary>("/api/lists", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listsQueryKey });
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

  return { lists, isPending, isError, createList, renameList };
}
