"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jsonFetch } from "@/lib/json-fetch";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

const todosQueryKey = (listId: string | null) => ["todos", listId ?? "none"] as const;

export const useTodos = (listId: string | null) => {
  const queryClient = useQueryClient();
  const hasActiveList = Boolean(listId);
  const queryKey = todosQueryKey(listId);

  const {
    data: todos = [],
    isPending: queryPending,
    isError,
  } = useQuery<Todo[]>({
    queryKey,
    queryFn: () => jsonFetch<Todo[]>(`/api/todos?listId=${encodeURIComponent(listId ?? "")}`),
    enabled: hasActiveList,
    staleTime: 30 * 1000, // Cache for 30 seconds - fast load, realtime keeps it fresh
    gcTime: 10 * 60 * 1000, // Cache in memory for 10 minutes
  });

  const invalidateTodos = () => {
    if (!hasActiveList) return;
    queryClient.invalidateQueries({ queryKey });
  };

  const createTodo = useMutation({
    mutationFn: async (payload: { text: string }) => {
      if (!hasActiveList || !listId) {
        throw new Error("Keine aktive Liste ausgewählt");
      }
      return jsonFetch<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify({ ...payload, listId }),
      });
    },
    onMutate: async ({ text }) => {
      if (!hasActiveList || !listId) {
        return { previousTodos: undefined };
      }
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey) ?? [];

      const optimisticTodo: Todo = {
        id: `optimistic-${crypto.randomUUID?.() ?? Date.now().toString()}`,
        text,
        done: false,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, [optimisticTodo, ...previousTodos]);

      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    onSettled: invalidateTodos,
  });

  const updateTodo = useMutation({
    mutationFn: ({ id, done, text }: { id: string; done?: boolean; text?: string }) => {
      const body: Record<string, unknown> = {};
      if (typeof done !== "undefined") body.done = done;
      if (typeof text !== "undefined") body.text = text;
      if (Object.keys(body).length === 0) {
        throw new Error("Nothing to update");
      }

      return jsonFetch<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async (variables) => {
      if (!hasActiveList) {
        return { previousTodos: undefined };
      }
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);

      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.map((todo) =>
          todo.id === variables.id
            ? {
                ...todo,
                ...(typeof variables.done !== "undefined" ? { done: variables.done } : {}),
                ...(typeof variables.text !== "undefined" ? { text: variables.text } : {}),
              }
            : todo,
        ),
      );

      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    onSettled: invalidateTodos,
  });

  const deleteTodo = useMutation({
    mutationFn: (id: string) => jsonFetch(`/api/todos/${id}`, { method: "DELETE" }),
    onSuccess: invalidateTodos,
  });

  const clearCompleted = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => jsonFetch(`/api/todos/${id}`, { method: "DELETE" })));
    },
    onMutate: async (ids) => {
      if (!hasActiveList) {
        return { previousTodos: undefined };
      }
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.filter((todo) => !ids.includes(todo.id)),
      );
      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    onSettled: invalidateTodos,
  });

  return {
    todos,
    isPending: hasActiveList ? queryPending : false,
    isError: hasActiveList ? isError : false,
    createTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
    invalidateTodos,
  };
}
