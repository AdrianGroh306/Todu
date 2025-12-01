import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";
import { ensureListOwnership } from "@/lib/list-access";

export async function POST(request: NextRequest) {
  try {
    const requestingUserId = await getUserId();
    const { listId, userId, role = "editor" } = (await request.json()) as {
      listId?: string;
      userId?: string;
      role?: string;
    };

    if (!listId || !userId) {
      return NextResponse.json({ error: "listId and userId are required" }, { status: 400 });
    }

    await ensureListOwnership(listId, requestingUserId);

    const { data, error } = await supabase
      .from("list_members")
      .insert({ list_id: listId, user_id: userId, role })
      .select("list_id, user_id, role, created_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/list-members failed", error);
    return NextResponse.json({ error: "Failed to add list member" }, { status: 500 });
  }
}
