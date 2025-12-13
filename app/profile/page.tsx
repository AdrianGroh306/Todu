import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/profile";
import { ProfilePageClient } from "@/features/auth/components/profile-page-client";

export const metadata = {
  title: "Profil - Clarydo",
  description: "Benutzerprofil und Einstellungen",
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const initialProfile = await getProfile();

  return <ProfilePageClient initialProfile={initialProfile} />;
}
