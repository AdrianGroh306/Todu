import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Todo } from "./use-todos";

export const useRealtimeTodos = (listId: string | null) => {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!listId) return;

    // Subscribe to changes on todos table for this specific list
    const subscription = supabase
      .channel(`todos:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "todos",
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          const queryKey = ["todos", listId] as const;
          const currentTodos = queryClient.getQueryData<Todo[]>(queryKey) ?? [];

          if (payload.eventType === "INSERT") {
            const newTodo = payload.new as Todo;
            queryClient.setQueryData<Todo[]>(queryKey, [newTodo, ...currentTodos]);
          } else if (payload.eventType === "UPDATE") {
            const updatedTodo = payload.new as Todo;
            queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
              current.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedTodo = payload.old as Todo;
            queryClient.setQueryData<Todo[]>(queryKey, (current = []) =>
              current.filter((todo) => todo.id !== deletedTodo.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [listId, queryClient, supabase]);
};
