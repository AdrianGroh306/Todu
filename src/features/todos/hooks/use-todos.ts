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
    queryFn: async () => {
      const data = await jsonFetch<Todo[]>(`/api/todos?listId=${encodeURIComponent(listId ?? "")}`);
      console.log("[useTodos] Fetched todos:", data.map(t => ({ id: t.id.slice(0,8), done: t.done })));
      return data;
    },
    enabled: hasActiveList,
    staleTime: 60 * 1000, // Consider fresh for 1 minute
    gcTime: 10 * 60 * 1000, // Cache in memory for 10 minutes
    refetchOnMount: true, // Refetch on mount if stale
    refetchOnWindowFocus: true, // Refetch when user returns to app
    refetchInterval: false, // No polling - use pull-to-refresh instead
  });

  const invalidateTodos = async () => {
    if (!hasActiveList) return;
    // Use refetchQueries instead of invalidateQueries to ensure we wait for fresh data
    await queryClient.refetchQueries({ queryKey, type: "active" });
  };

  const createTodo = useMutation({
    mutationKey: ["todos"],
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
    onSuccess: (newTodo) => {
      // Replace optimistic todo with real one from server
      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.map((todo) =>
          todo.id.startsWith("optimistic-") ? newTodo : todo
        )
      );
    },
  });

  const updateTodo = useMutation({
    mutationKey: ["todos"],
    mutationFn: async ({ id, done, text }: { id: string; done?: boolean; text?: string }) => {
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
    onMutate: async ({ id, done, text }) => {
      if (!hasActiveList) return { previousTodos: undefined };
      
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey) ?? [];

      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.map((todo) =>
          todo.id === id
            ? { ...todo, ...(done !== undefined && { done }), ...(text !== undefined && { text }) }
            : todo
        )
      );

      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    onSuccess: (updatedTodo) => {
      // Update cache with server response
      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.map((todo) =>
          todo.id === updatedTodo.id ? updatedTodo : todo
        )
      );
    },
  });

  const deleteTodo = useMutation({
    mutationKey: ["todos"],
    mutationFn: (id: string) => jsonFetch(`/api/todos/${id}`, { method: "DELETE" }),
    onSuccess: invalidateTodos,
  });

  const clearCompleted = useMutation({
    mutationKey: ["todos"],
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
    onSuccess: invalidateTodos,
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
