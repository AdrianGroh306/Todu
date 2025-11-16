import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const userId = clerkUserIdToUuid(await requireUser());

    const { data, error } = await supabase
      .from("todos")
      .select("id, text, done, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/todos failed", error);
    return NextResponse.json({ error: "Failed to load todos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = clerkUserIdToUuid(await requireUser());
    const { text } = (await request.json()) as { text?: string };

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("todos")
      .insert({ user_id: userId, text: text.trim(), done: false })
      .select("id, text, done, created_at")
      .single();

    if (error) {
      throw error;
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
