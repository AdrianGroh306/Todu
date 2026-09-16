import { supabase as serviceSupabase } from "@/lib/supabase";

export type ListSummary = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  role: "owner" | "editor" | "viewer";
};

type MembershipRow = {
  role: ListSummary["role"];
  lists: { id: string; name: string; created_at: string; updated_at: string };
};

export const getLists = async (userId: string): Promise<ListSummary[]> => {
  const { data, error } = await serviceSupabase
    .from("list_members")
    .select(`
      role,
      lists!inner (
        id,
        name,
        created_at,
        updated_at
      )
    `)
    .eq("user_id", userId)
    .returns<MembershipRow[]>();

  if (error) {
    console.error("Error fetching lists:", error);
    return [];
  }

  return (data || [])
    .map((item) => ({
      id: item.lists.id,
      name: item.lists.name,
      created_at: item.lists.created_at,
      updated_at: item.lists.updated_at,
      role: item.role,
    }))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
};
