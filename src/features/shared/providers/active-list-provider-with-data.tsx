"use client";

import { type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ActiveListProvider } from "./active-list-provider";
import type { ListSummary } from "@/lib/data/lists";
import type { Todo } from "@/lib/data/todos";

type ActiveListProviderWithDataProps = {
  children: ReactNode;
  initialLists: ListSummary[];
  initialActiveListId: string | null;
  initialTodos: Todo[];
  renderedAt: number;
};

export const ActiveListProviderWithData = ({
  children,
  initialLists,
  initialActiveListId,
  initialTodos,
  renderedAt,
}: ActiveListProviderWithDataProps) => {
  const queryClient = useQueryClient();

  // The HTML may come from the service worker cache: stamping the server render time lets
  // newer persisted data win on restore and marks old snapshots stale so they refetch.
  if (!queryClient.getQueryData(["lists"])) {
    queryClient.setQueryData(["lists"], initialLists, { updatedAt: renderedAt });
  }

  if (initialActiveListId && !queryClient.getQueryData(["todos", initialActiveListId])) {
    queryClient.setQueryData(["todos", initialActiveListId], initialTodos, { updatedAt: renderedAt });
  }

  return (
    <ActiveListProvider initialActiveListId={initialActiveListId}>
      {children}
    </ActiveListProvider>
  );
};
