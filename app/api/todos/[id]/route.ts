import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";
import { ensureListAccess } from "@/lib/list-access";

async function getTodoListId(todoId: string) {
  const { data, error } = await supabase
    .from("todos")
    .select("id, list_id")
    .eq("id", todoId)
    .single<{ id: string; list_id: string }>();

  if (error || !data) {
    throw error ?? new Error("Todo not found");
  }

  return data.list_id;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let todoId = "";
  try {
    ({ id: todoId } = await context.params);
    const userUuid = await getUserId();
    const { text, done } = (await request.json()) as {
      text?: string;
      done?: boolean;
    };

    if (typeof text === "undefined" && typeof done === "undefined") {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const listId = await getTodoListId(todoId);
    await ensureListAccess(listId, userUuid);

    const update: Record<string, unknown> = {};
    if (typeof text !== "undefined") update.text = text.trim();
    if (typeof done !== "undefined") update.done = done;

    console.log("[PATCH /api/todos] Updating todo", todoId.slice(0,8), "with:", update);

    const { data, error } = await supabase
      .from("todos")
      .update(update)
      .eq("id", todoId)
      .select("id, text, done, created_at, list_id")
      .single();

    if (error) {
      throw error;
    }

    console.log("[PATCH /api/todos] Updated result:", { id: data.id.slice(0,8), done: data.done });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`PATCH /api/todos/${todoId} failed`, error);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let todoId = "";
  try {
    ({ id: todoId } = await context.params);
    const userUuid = await getUserId();
    const listId = await getTodoListId(todoId);
    await ensureListAccess(listId, userUuid);

    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", todoId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(`DELETE /api/todos/${todoId} failed`, error);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
