"use client";

import { User } from "lucide-react";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useModalManager } from "@/features/shared/providers/modal-manager-provider";
import type { ReactNode } from "react";

type UserAvatarProps = {
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
};

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export const UserAvatar = ({ size = "md", children }: UserAvatarProps) => {
  const { user, isLoading } = useAuth();
  const { openModal } = useModalManager();

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
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <button
      type="button"
      onClick={() => openModal("profile")}
      className="group inline-flex items-center -space-x-3 rounded-full p-1 transition hover:ring-2 hover:ring-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary"
      aria-label="Profil öffnen"
    >
      <span
        className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-theme-accent text-white font-medium`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Profilbild"
            className="h-full w-full object-cover"
          />
        ) : initial ? (
          initial
        ) : (
          <User className="h-4 w-4" />
        )}
      </span>
      {children}
    </button>
  );
};
