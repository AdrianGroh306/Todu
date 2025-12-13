import { createClient } from "@/lib/supabase/server";

export type ProfileData = {
  username: string | null;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string | null;
};

/**
 * Server-side function to fetch profile data for the authenticated user
 * Used for initial data fetching in Server Components
 */
export const getProfile = async (): Promise<ProfileData | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch username from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return {
    username: profile?.username ?? null,
    avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
  };
};
