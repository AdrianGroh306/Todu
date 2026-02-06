import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";
import { ensureListAccess, ensureListOwnership } from "@/lib/list-access";
import { sendPushToUser } from "@/lib/push-sender";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ listId: string }> },
) {
  const { listId } = await context.params;
  try {
    const userId = await getUserId();
    await ensureListOwnership(listId, userId);

    const { data, error } = await supabase
      .from("list_members")
      .select("user_id, role, created_at")
      .eq("list_id", listId);

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`GET /api/list-members/${listId} failed`, error);
    return NextResponse.json({ error: "Failed to load list members" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ listId: string }> },
) {
  const { listId } = await context.params;
  try {
    const userId = await getUserId();
    const targetUserId = new URL(request.url).searchParams.get("userId") ?? userId;
    const access = await ensureListAccess(listId, userId);
    const isOwner = access.role === "owner";

    if (targetUserId !== userId && !isOwner) {
      return NextResponse.json({ error: "Nur Besitzer können andere entfernen" }, { status: 403 });
    }

    if (targetUserId === userId && isOwner) {
      return NextResponse.json({ error: "Owner können ihre eigene Liste nicht verlassen" }, { status: 400 });
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "userId query param is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("list_members")
      .delete()
      .eq("list_id", listId)
      .eq("user_id", targetUserId);

    if (error) {
      throw error;
    }

    // Notify owner when a member leaves (only if member left on their own, not kicked)
    if (targetUserId === userId) {
      const { data: listData } = await supabase
        .from("lists")
        .select("name, owner_id")
        .eq("id", listId)
        .single();

      if (listData?.owner_id) {
        const { data: leavingProfile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", targetUserId)
          .single();

        const leavingName = leavingProfile?.username || "Jemand";
        sendPushToUser(listData.owner_id, {
          title: "Mitglied hat Liste verlassen",
          body: `${leavingName} hat "${listData.name}" verlassen`,
          tag: "member-left",
          url: "/",
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`DELETE /api/list-members/${listId} failed`, error);
    return NextResponse.json({ error: "Failed to remove list member" }, { status: 500 });
  }
}
