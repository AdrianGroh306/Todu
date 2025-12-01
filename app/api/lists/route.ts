import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";

export async function GET() {
  try {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from("list_members")
      .select("role, list_id, lists(id, name, created_at, updated_at)")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    type MembershipRow = {
      role: string;
      list_id: string;
      lists: { id: string; name: string; created_at: string; updated_at: string } | null;
    };

    const memberships = (data ?? []) as unknown as MembershipRow[];

    const lists = memberships.map((membership) => ({
      id: membership.lists?.id ?? membership.list_id,
      name: membership.lists?.name ?? "",
      created_at: membership.lists?.created_at,
      updated_at: membership.lists?.updated_at,
      role: membership.role,
    }));

    return NextResponse.json(lists);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("GET /api/lists failed", error);
    return NextResponse.json({ error: "Failed to load lists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { name } = (await request.json()) as { name?: string };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: list, error } = await supabase
      .from("lists")
      .insert({ name: name.trim(), user_id: userId })
      .select("id, name, created_at, updated_at")
      .single();

    if (error) {
      throw error;
    }

    try {
      await supabase
        .from("list_members")
        .insert({ list_id: list.id, user_id: userId, role: "owner" })
        .select("list_id")
        .single();
    } catch (membershipError) {
      console.error("Failed to insert owner membership", membershipError);
    }

    return NextResponse.json({ ...list, role: "owner" }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/lists failed", error);
    return NextResponse.json({ error: "Failed to create list" }, { status: 500 });
  }
}
