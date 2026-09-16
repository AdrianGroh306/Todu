import { supabase as serviceSupabase } from "@/lib/supabase";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

// Uses the service role: callers must verify list membership before returning the result.
export const getTodosForList = async (listId: string | null): Promise<Todo[]> => {
  if (!listId) {
    return [];
  }

  const { data, error } = await serviceSupabase
    .from("todos")
    .select("id, text, done, created_at")
    .eq("list_id", listId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching todos:", error);
    return [];
  }

  return data || [];
};
