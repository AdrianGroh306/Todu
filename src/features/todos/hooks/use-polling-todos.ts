"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jsonFetch } from "@/lib/json-fetch";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/providers/auth-provider";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

export type PresenceUser = {
  userId: string;
  username?: string;
  avatar?: string;
  color?: string;
};

const todosQueryKey = (listId: string | null) => ["todos", listId ?? "none"] as const;

export const usePollingTodos = (listId: string | null) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasActiveList = Boolean(listId);
  const userId = user?.id ?? null;

  const queryKey = todosQueryKey(listId);

  const {
    data: todos = [] as Todo[],
    isPending: queryPending,
    isError,
  } = useQuery<Todo[]>({
    queryKey,
    queryFn: async () => {
      const data = await jsonFetch<Todo[]>(
        `/api/todos?listId=${encodeURIComponent(listId ?? "")}`
      );
      return data;
    },
    enabled: hasActiveList,
    staleTime: 5 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 8 * 1000,
    refetchIntervalInBackground: true,
  });

  const completedTodos = useMemo(() => (todos as Todo[]).filter((t: Todo) => t.done), [todos]);
  const totalTodos = (todos as Todo[]).length;
  const completedCount = completedTodos.length;
  const openTodosCount = totalTodos - completedCount;

  const createTodo = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      if (!hasActiveList || !listId) {
        throw new Error("Keine aktive Liste ausgewählt");
      }
      return jsonFetch<Todo>("/api/todos", {
        method: "POST",
        body: JSON.stringify({
          text,
          listId,
        }),
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
      void queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (newTodo) => {
      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.map((todo) => (todo.id.startsWith("optimistic-") ? newTodo : todo))
      );
    },
  });

  const updateTodo = useMutation({
    mutationFn: async ({ id, done, text }: { id: string; done?: boolean; text?: string }) => {
      if (!hasActiveList || !listId) {
        throw new Error("Keine aktive Liste ausgewählt");
      }
      return jsonFetch<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          done,
          text,
          listId,
        }),
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
      void queryClient.invalidateQueries({ queryKey });
    },
    onSuccess: (updatedTodo) => {
      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
      );
    },
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      if (!hasActiveList || !listId) {
        throw new Error("Keine aktive Liste ausgewählt");
      }
      await jsonFetch(`/api/todos/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ listId }),
      });
    },
    onMutate: async (id) => {
      if (!hasActiveList) return { previousTodos: undefined };
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey) ?? [];
      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.filter((todo) => todo.id !== id)
      );
      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const clearCompleted = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!hasActiveList || !listId) {
        throw new Error("Keine aktive Liste ausgewählt");
      }
      await Promise.all(
        ids.map((id) =>
          jsonFetch(`/api/todos/${id}`, {
            method: "DELETE",
            body: JSON.stringify({ listId }),
          })
        )
      );
    },
    onMutate: async (ids) => {
      if (!hasActiveList) {
        return { previousTodos: undefined };
      }
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
        current.filter((todo) => !ids.includes(todo.id))
      );
      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const invalidateTodos = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  const presenceQueryKey = ["presence", listId ?? "none"] as const;

  const {
    data: presenceRows = [],
  } = useQuery<
    Array<{
      user_id: string;
      list_id: string | null;
      last_seen: string;
      avatar_url?: string | null;
      display_name?: string | null;
    }>
  >({
    queryKey: presenceQueryKey,
    queryFn: async () => {
      if (!listId) return [];
      const supabase = createSupabaseClient();
      const since = new Date(Date.now() - 30_000).toISOString();
      const { data, error } = await supabase
        .from("presence")
        .select("user_id, list_id, last_seen, avatar_url, display_name")
        .eq("list_id", listId)
        .gte("last_seen", since);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    enabled: Boolean(listId),
    refetchInterval: 10 * 1000,
    staleTime: 5 * 1000,
  });

  useEffect(() => {
    if (!listId || !userId) return;
    const supabase = createSupabaseClient();

    const updatePresence = async () => {
      await supabase.from("presence").upsert(
        {
          user_id: userId,
          list_id: listId,
          last_seen: new Date().toISOString(),
          avatar_url: (user?.user_metadata?.avatar_url as string | undefined) ?? null,
          display_name:
            (user?.user_metadata?.full_name as string | undefined) ??
            (user?.user_metadata?.name as string | undefined) ??
            user?.email ??
            null,
        },
        { onConflict: "user_id" },
      );
    };

    void updatePresence();
    const interval = setInterval(updatePresence, 15_000);

    return () => clearInterval(interval);
  }, [listId, user, userId]);

  const activeUsers = useMemo<PresenceUser[]>(() => {
    if (!listId) return [];
    return presenceRows
      .filter((row) => row.user_id !== userId)
      .map((row) => ({
        userId: row.user_id,
        username: row.display_name ?? undefined,
        avatar: row.avatar_url ?? undefined,
      }));
  }, [listId, presenceRows, userId]);

  return {
    todos,
    completedTodos,
    totalTodos,
    completedCount,
    openTodosCount,
    isPending: queryPending,
    isError,
    createTodo,
    updateTodo,
    deleteTodo,
    clearCompleted,
    invalidateTodos,
    activeUsers,
  };
};
