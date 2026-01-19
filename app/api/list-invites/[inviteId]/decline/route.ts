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
      .select("id, invited_user_id, status")
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

    const { error: updateError } = await supabase
      .from("list_invites")
      .update({ status: "declined" })
      .eq("id", inviteId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/list-invites/[inviteId]/decline failed", error);
    return NextResponse.json({ error: "Failed to decline invite" }, { status: 500 });
  }
}
