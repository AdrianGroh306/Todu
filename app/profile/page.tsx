import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/profile";
import { ProfilePage } from "@/features/auth/components/profile-page";

export const metadata = {
  title: "Profil - Todu",
  description: "Benutzerprofil und Einstellungen",
};

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const initialProfile = await getProfile();

  return <ProfilePage initialProfile={initialProfile} />;
}
