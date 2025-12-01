import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";
import { ensureListOwnership } from "@/lib/list-access";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: listId } = await context.params;
  try {
    const userId = await getUserId();
    await ensureListOwnership(listId, userId);
    const { name } = (await request.json()) as { name?: string };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("lists")
      .update({ name: name.trim() })
      .eq("id", listId)
      .select("id, name, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`PATCH /api/lists/${listId} failed`, error);
    return NextResponse.json({ error: "Failed to update list" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: listId } = await context.params;
  try {
    const userId = await getUserId();
    await ensureListOwnership(listId, userId);

    const { error } = await supabase.from("lists").delete().eq("id", listId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`DELETE /api/lists/${listId} failed`, error);
    return NextResponse.json({ error: "Failed to delete list" }, { status: 500 });
  }
}
