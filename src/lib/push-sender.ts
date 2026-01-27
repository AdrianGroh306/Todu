import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  "mailto:hello@todu.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type NotificationPayload = {
  title: string;
  body: string;
  tag?: string;
  url?: string;
};

type PushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function sendPushToUser(userId: string, payload: NotificationPayload) {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys")
    .eq("user_id", userId);

  if (!subscriptions?.length) return;

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys as PushSubscription["keys"] },
        JSON.stringify(payload)
      )
    )
  );

  // Cleanup: Remove invalid subscriptions (410 Gone = subscription expired)
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (
      result.status === "rejected" &&
      (result.reason as { statusCode?: number })?.statusCode === 410
    ) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", subscriptions[i].endpoint);
    }
  }
}
