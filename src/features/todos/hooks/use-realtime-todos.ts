import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeTodos(listId: string | null) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!listId) return;

    console.log("Setting up realtime subscription for listId:", listId);

    // Subscribe to changes on todos table for this specific list
    const subscription = supabase
      .channel(`todos:${listId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "todos",
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          console.log("Realtime update received:", payload);
          // Invalidate the todos query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ["todos", listId] });
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up realtime subscription for listId:", listId);
      subscription.unsubscribe();
    };
  }, [listId, queryClient, supabase]);
}
