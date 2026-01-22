import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "./push-sender";

const COOLDOWN_MINUTES = 5;

type ListMember = {
  user_id: string;
};

export async function notifyListMembers(
  listId: string,
  changedByUserId: string,
  listName: string
) {
  const supabase = await createClient();
  const now = new Date();
  const cooldownThreshold = new Date(now.getTime() - COOLDOWN_MINUTES * 60 * 1000);

  // 1. Get all list members except the one who made the change
  const { data: list } = await supabase
    .from("lists")
    .select("user_id, list_members(user_id)")
    .eq("id", listId)
    .single<{ user_id: string; list_members: ListMember[] | null }>();

  if (!list) return;

  const memberIds = [
    list.user_id,
    ...(list.list_members?.map((m) => m.user_id) || []),
  ].filter((id) => id !== changedByUserId);

  if (memberIds.length === 0) return;

  // 2. Check cooldown for each user
  const { data: cooldowns } = await supabase
    .from("notification_cooldowns")
    .select("user_id, last_notified_at")
    .eq("list_id", listId)
    .in("user_id", memberIds);

  const cooldownMap = new Map(
    cooldowns?.map((c) => [c.user_id, new Date(c.last_notified_at)]) || []
  );

  // 3. Send notifications to users without active cooldown
  for (const userId of memberIds) {
    const lastNotified = cooldownMap.get(userId);

    if (!lastNotified || lastNotified < cooldownThreshold) {
      await sendPushToUser(userId, {
        title: listName,
        body: "Die Liste wurde aktualisiert",
        tag: `list-${listId}`,
        url: `/?list=${listId}`,
      });

      // Update cooldown
      await supabase.from("notification_cooldowns").upsert({
        list_id: listId,
        user_id: userId,
        last_notified_at: now.toISOString(),
      });
    }
  }
}
