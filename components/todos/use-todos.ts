"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

const todosQueryKey = ["todos"] as const;

async function jsonFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
}

export function useTodos() {
  const queryClient = useQueryClient();

  const invalidateTodos = () =>
    queryClient.invalidateQueries({ queryKey: todosQueryKey });

  const {
    data: todos = [],
    isPending,
    isError,
  } = useQuery<Todo[]>({
    queryKey: todosQueryKey,
    queryFn: () => jsonFetch<Todo[]>("/api/todos"),
  });

  const createTodo = useMutation({
    mutationFn: (payload: { text: string }) =>
      jsonFetch<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidateTodos,
  });

  const updateTodo = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      jsonFetch<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ done }),
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(todosQueryKey);

      queryClient.setQueryData<Todo[]>(todosQueryKey, (current = []) =>
        current.map((todo) =>
          todo.id === variables.id ? { ...todo, done: variables.done } : todo,
        ),
      );

      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todosQueryKey, context.previousTodos);
      }
    },
  });

  const deleteTodo = useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/todos/${id}`, { method: "DELETE" }),
    onSuccess: invalidateTodos,
  });

  const clearCompleted = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => jsonFetch(`/api/todos/${id}`, { method: "DELETE" })),
      );
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(todosQueryKey);
      queryClient.setQueryData<Todo[]>(todosQueryKey, (current = []) =>
        current.filter((todo) => !ids.includes(todo.id)),
      );
      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todosQueryKey, context.previousTodos);
      }
    },
    onSettled: invalidateTodos,
  });

  return {
    todos,
    isPending,
    isError,
    createTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
    invalidateTodos,
  };
}
