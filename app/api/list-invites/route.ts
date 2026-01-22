import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";
import { ensureListOwnership } from "@/lib/list-access";
import { sendPushToUser } from "@/lib/push-sender";

export async function POST(request: NextRequest) {
  try {
    const requestingUserId = await getUserId();
    const { listId, username } = (await request.json()) as {
      listId?: string;
      username?: string;
    };

    if (!listId || !username) {
      return NextResponse.json({ error: "listId and username are required" }, { status: 400 });
    }

    await ensureListOwnership(listId, requestingUserId);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", username.trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (profile.id === requestingUserId) {
      return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
    }

    const { data: existingMember } = await supabase
      .from("list_members")
      .select("user_id")
      .eq("list_id", listId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    const { data: existingInvite } = await supabase
      .from("list_invites")
      .select("id")
      .eq("list_id", listId)
      .eq("invited_user_id", profile.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json({ error: "Invite already pending" }, { status: 409 });
    }

    const { data: invite, error: inviteError } = await supabase
      .from("list_invites")
      .insert({
        list_id: listId,
        invited_user_id: profile.id,
        invited_by: requestingUserId,
        status: "pending",
      })
      .select("id, list_id, invited_user_id, created_at")
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Get list name and inviter name for notification
    const { data: listData } = await supabase
      .from("lists")
      .select("name")
      .eq("id", listId)
      .single();

    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", requestingUserId)
      .single();

    // Send push notification to invited user (non-blocking)
    if (listData?.name) {
      const inviterName = inviterProfile?.username || "Jemand";
      sendPushToUser(profile.id, {
        title: "Neue Einladung",
        body: `${inviterName} hat dich zu "${listData.name}" eingeladen`,
        tag: "invite",
        url: "/",
      }).catch(() => {
        // Ignore notification errors
      });
    }

    return NextResponse.json(
      { invite, invitedUsername: profile.username },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/list-invites failed", error);
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }
}
