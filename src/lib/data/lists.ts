import { createClient } from "@/lib/supabase/server";
import { supabase as serviceSupabase } from "@/lib/supabase";

export type ListSummary = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  role: "owner" | "editor" | "viewer";
};

/**
 * Server-side function to fetch all lists for the authenticated user
 * Used for initial data fetching in Server Components
 */
export const getLists = async (): Promise<ListSummary[]> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await serviceSupabase
    .from("list_members")
    .select(`
      list_id,
      role,
      lists!inner (
        id,
        name,
        created_at,
        updated_at
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching lists:", error);
    return [];
  }

  // Sort by updated_at descending (newest first)
  return (data || [])
    .map((item: any) => ({
      id: item.lists.id,
      name: item.lists.name,
      created_at: item.lists.created_at,
      updated_at: item.lists.updated_at,
      role: item.role,
    }))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
};
