import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { clerkUserIdToUuid } from "@/lib/user-id";

class UnauthorizedError extends Error {}

async function requireUser() {
  const session = await auth();
  if (!session?.userId) {
    throw new UnauthorizedError("Unauthorized");
  }
  return session.userId;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let todoId = "";
  try {
    ({ id: todoId } = await context.params);
    const userId = await requireUser();
    const userUuid = clerkUserIdToUuid(userId);
    const { text, done } = (await request.json()) as {
      text?: string;
      done?: boolean;
    };

    if (typeof text === "undefined" && typeof done === "undefined") {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (typeof text !== "undefined") update.text = text.trim();
    if (typeof done !== "undefined") update.done = done;

    const { data, error } = await supabase
      .from("todos")
      .update(update)
      .eq("id", todoId)
      .eq("user_id", userUuid)
      .select("id, text, done, created_at")
      .single();

    if (error) {
      throw error;
    }

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
    const userUuid = clerkUserIdToUuid(await requireUser());

    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", todoId)
      .eq("user_id", userUuid);

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
