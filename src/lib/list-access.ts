import { supabase } from "./supabase";
import { UnauthorizedError } from "./api-auth";

export type ListMembershipRole = "owner" | "editor" | "viewer";

type ListAccessRow = {
  id: string;
  user_id: string;
  name: string;
  list_members: { user_id: string; role: ListMembershipRole }[];
};

export async function ensureListAccess(listId: string, userId: string) {
  const { data, error } = await supabase
    .from("lists")
    .select("id, user_id, name, list_members(user_id, role)")
    .eq("id", listId)
    .single<ListAccessRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new UnauthorizedError("List not found");
  }

  const isOwner = data.user_id === userId;
  const membership = data.list_members?.find((member) => member.user_id === userId);

  if (!isOwner && !membership) {
    throw new UnauthorizedError("Access to this list is not allowed");
  }

  return { role: membership?.role ?? ("owner" as ListMembershipRole), listName: data.name };
}

export async function ensureListOwnership(listId: string, userId: string) {
  const membership = await ensureListAccess(listId, userId);
  if (membership.role !== "owner") {
    throw new UnauthorizedError("Only owners can perform this action");
  }
}
