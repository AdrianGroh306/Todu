import { after, NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";
import { ensureListAccess } from "@/lib/list-access";
import { notifyListMembers } from "@/lib/notify-list-members";

// Disable caching for this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const listId = new URL(request.url).searchParams.get("listId");
    if (!listId) {
      return NextResponse.json({ error: "listId is required" }, { status: 400 });
    }

    const userId = await getUserId();

    // Access check and query run in parallel; data is only returned if access passes.
    const [, { data, error }] = await Promise.all([
      ensureListAccess(listId, userId),
      supabase
        .from("todos")
        .select("id, text, done, created_at")
        .eq("list_id", listId)
        .order("created_at", { ascending: false }),
    ]);

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? [], {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/todos failed", error);
    return NextResponse.json({ error: "Failed to load todos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const [userId, { text, listId }] = await Promise.all([
      getUserId(),
      request.json() as Promise<{ text?: string; listId?: string }>,
    ]);

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!listId) {
      return NextResponse.json({ error: "listId is required" }, { status: 400 });
    }

    const { listName } = await ensureListAccess(listId, userId);

    const { data, error } = await supabase
      .from("todos")
      .insert({ list_id: listId, text: text.trim(), done: false })
      .select("id, text, done, created_at, list_id")
      .single();

    if (error) {
      throw error;
    }

    if (listName) {
      after(() => notifyListMembers(listId, userId, listName).catch(() => {}));
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/todos failed", error);
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
  }
}
