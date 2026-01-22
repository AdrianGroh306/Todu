import { NextResponse } from "next/server";
import { getUserId, UnauthorizedError } from "@/lib/api-auth";
import { sendPushToUser } from "@/lib/push-sender";

// Test endpoint to send a push notification to yourself
export async function POST() {
  try {
    const userId = await getUserId();

    await sendPushToUser(userId, {
      title: "Test Notification",
      body: "Push Notifications funktionieren! 🎉",
      tag: "test",
      url: "/",
    });

    return NextResponse.json({ success: true, message: "Notification sent" });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Test push error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
