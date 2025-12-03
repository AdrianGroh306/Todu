"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SettingsModal } from "@/components/settings/settings-modal";

type UserAvatarProps = {
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
};

export function UserAvatar({ size = "md" }: UserAvatarProps) {
  const { user, isLoaded } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div
        className={`${sizeClasses[size]} animate-pulse rounded-full bg-theme-surface`}
      />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className={`${sizeClasses[size]} overflow-hidden rounded-full ring-2 ring-transparent transition hover:ring-theme-primary focus:outline-none focus:ring-theme-primary`}
      >
        <img
          src={user.imageUrl}
          alt={user.fullName ?? "User"}
          className="h-full w-full object-cover"
        />
      </button>

      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
