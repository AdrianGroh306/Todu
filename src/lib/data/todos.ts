import { createClient } from "@/lib/supabase/server";
import { supabase as serviceSupabase } from "@/lib/supabase";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
  created_at: string;
};

/**
 * Server-side function to fetch todos for a specific list
 * Used for initial data fetching in Server Components
 */
export const getTodosForList = async (listId: string | null): Promise<Todo[]> => {
  if (!listId) {
    return [];
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Verify user has access to this list
  const { data: membership } = await serviceSupabase
    .from("list_members")
    .select("role")
    .eq("list_id", listId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return [];
  }

  const { data, error } = await serviceSupabase
    .from("todos")
    .select("id, text, done, created_at, list_id")
    .eq("list_id", listId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching todos:", error);
    return [];
  }

  return data || [];
};
