"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { ProfileData } from "@/lib/data/profile";
import { CloseButton } from "@/components/close-button";
import { ProfilePage } from "./profile-page";

type ProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export const ProfileModal = ({ open, onClose }: ProfileModalProps) => {
  const { user, isLoading } = useAuth();
  const supabase = createClient();

  const { data, isPending } = useQuery<ProfileData | null>({
    queryKey: ["profile", user?.id ?? "none"],
    enabled: open && Boolean(user),
    queryFn: async () => {
      if (!user) return null;
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
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-theme-bg pt-safe">
      {isLoading || isPending ? (
        <ProfileSkeleton onClose={onClose} />
      ) : (
        <ProfilePage initialProfile={data ?? null} onClose={onClose} />
      )}
    </div>
  );
};

const ProfileSkeleton = ({ onClose }: { onClose: () => void }) => {
  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col overflow-y-auto px-4 pt-4 pb-8 safe-top text-theme-text">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="h-7 w-24 animate-pulse rounded bg-theme-surface/70" />
        <CloseButton onClick={onClose} ariaLabel="Profil schließen" />
      </div>

      <section className="mb-8 rounded-2xl bg-theme-surface p-6">
        <div className="mb-6 h-5 w-40 animate-pulse rounded bg-theme-surface/70" />
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-theme-surface/70" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-theme-surface/70" />
              <div className="h-3 w-40 animate-pulse rounded bg-theme-surface/70" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-theme-surface/70" />
            <div className="h-4 w-48 animate-pulse rounded bg-theme-surface/70" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-theme-surface/70" />
            <div className="h-4 w-56 animate-pulse rounded bg-theme-surface/70" />
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-2xl bg-theme-surface p-6">
        <div className="mb-6 h-5 w-24 animate-pulse rounded bg-theme-surface/70" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`theme-skeleton-${index}`}
              className="h-9 w-20 animate-pulse rounded-xl bg-theme-surface/70"
            />
          ))}
        </div>
      </section>
    </main>
  );
};
