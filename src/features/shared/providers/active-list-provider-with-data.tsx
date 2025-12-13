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
};

export const ActiveListProviderWithData = ({
  children,
  initialLists,
  initialActiveListId,
  initialTodos,
}: ActiveListProviderWithDataProps) => {
  const queryClient = useQueryClient();

  if (!queryClient.getQueryData(["lists"])) {
    queryClient.setQueryData(["lists"], initialLists);
  }

  if (initialActiveListId && !queryClient.getQueryData(["todos", initialActiveListId])) {
    queryClient.setQueryData(["todos", initialActiveListId], initialTodos);
  }

  return (
    <ActiveListProvider initialActiveListId={initialActiveListId}>
      {children}
    </ActiveListProvider>
  );
};
