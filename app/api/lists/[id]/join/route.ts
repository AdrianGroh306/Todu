import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserId();
    const { id: listId } = await context.params;

    // Check if the list exists
    const { data: list, error: listError } = await supabase
      .from("lists")
      .select("id, name, owner_id")
      .eq("id", listId)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Check if user is already the owner
    if (list.owner_id === userId) {
      return NextResponse.json(
        { error: "You are already the owner of this list", listId, listName: list.name },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("list_members")
      .select("user_id")
      .eq("list_id", listId)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this list", listId, listName: list.name },
        { status: 400 }
      );
    }

    // Add user as editor (default role for invite links)
    const { error: insertError } = await supabase
      .from("list_members")
      .insert({ list_id: listId, user_id: userId, role: "editor" });

    if (insertError) {
      console.error("Failed to join list", insertError);
      return NextResponse.json({ error: "Failed to join list" }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, listId, listName: list.name },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/lists/[id]/join failed", error);
    return NextResponse.json({ error: "Failed to join list" }, { status: 500 });
  }
}
