import { createClient } from "@/lib/supabase/server";

export class UnauthorizedError extends Error {}

export async function getUserId(): Promise<string> {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new UnauthorizedError("Unauthorized");
  }

  return user.id;
}
