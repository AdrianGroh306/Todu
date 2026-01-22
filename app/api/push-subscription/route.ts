import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const subscription = await request.json();

    const supabase = await createClient();

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { onConflict: "user_id,endpoint" }
    );

    if (error) {
      console.error("Failed to save push subscription:", error);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Push subscription error:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await getUserId();
    const supabase = await createClient();

    await supabase.from("push_subscriptions").delete().eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
