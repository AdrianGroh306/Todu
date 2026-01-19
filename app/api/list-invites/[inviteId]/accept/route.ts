import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  try {
    const userId = await getUserId();
    const { inviteId } = await params;

    const { data: invite, error: inviteError } = await supabase
      .from("list_invites")
      .select("id, list_id, invited_user_id, status, lists!inner(name)")
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.invited_user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invite already handled" }, { status: 400 });
    }

    const { data: existingMember } = await supabase
      .from("list_members")
      .select("user_id")
      .eq("list_id", invite.list_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingMember) {
      const { error: insertError } = await supabase
        .from("list_members")
        .insert({ list_id: invite.list_id, user_id: userId, role: "editor" });

      if (insertError) {
        throw insertError;
      }
    }

    const { error: updateError } = await supabase
      .from("list_invites")
      .update({ status: "accepted" })
      .eq("id", inviteId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      listId: invite.list_id,
      listName: (invite.lists as any)?.name ?? "",
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/list-invites/[inviteId]/accept failed", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}
