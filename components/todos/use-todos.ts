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
    onMutate: async ({ text }) => {
      await queryClient.cancelQueries({ queryKey: todosQueryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(todosQueryKey) ?? [];

      const optimisticTodo: Todo = {
        id: `optimistic-${crypto.randomUUID?.() ?? Date.now().toString()}`,
        text,
        done: false,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(todosQueryKey, [optimisticTodo, ...previousTodos]);

      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(todosQueryKey, context.previousTodos);
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
      await queryClient.cancelQueries({ queryKey: todosQueryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(todosQueryKey);

      queryClient.setQueryData<Todo[]>(todosQueryKey, (current = []) =>
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
