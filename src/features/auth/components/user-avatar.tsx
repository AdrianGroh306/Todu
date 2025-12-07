"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { SettingsModal } from "@/features/auth/components/settings-modal";

type UserAvatarProps = {
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function UserAvatar({ size = "md" }: UserAvatarProps) {
  const { user, isLoading } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isLoading) {
    return (
      <div
        className={`${sizeClasses[size]} animate-pulse rounded-full bg-theme-surface`}
      />
    );
  }

  if (!user) {
    return null;
  }

  const email = user.email ?? "";
  const initial = email.charAt(0).toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className={`${sizeClasses[size]} flex cursor-pointer items-center justify-center overflow-hidden rounded-full bg-theme-accent text-white font-medium ring-2 ring-transparent transition hover:ring-theme-primary focus:outline-none focus:ring-theme-primary`}
      >
        {initial}
      </button>

      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
