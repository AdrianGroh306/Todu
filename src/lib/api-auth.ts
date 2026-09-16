import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export class UnauthorizedError extends Error {}

// getClaims verifies the JWT locally when the project uses asymmetric signing keys
// (falls back to a network getUser otherwise). cache() dedupes it per request.
export const getAuthUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
});

export async function getUserId(): Promise<string> {
  const userId = await getAuthUserId();

  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  return userId;
}
