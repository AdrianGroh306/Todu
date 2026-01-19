import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from("list_invites")
      .select("id, list_id, invited_by, status, created_at")
      .eq("invited_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ invite: null });
    }

    const { data: list } = await supabase
      .from("lists")
      .select("name")
      .eq("id", data.list_id)
      .maybeSingle();

    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", data.invited_by)
      .maybeSingle();

    return NextResponse.json({
      invite: {
        id: data.id,
        listId: data.list_id,
        listName: list?.name ?? "",
        inviterUsername: inviterProfile?.username ?? null,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/list-invites/latest failed", error);
    return NextResponse.json({ error: "Failed to load invite" }, { status: 500 });
  }
}
