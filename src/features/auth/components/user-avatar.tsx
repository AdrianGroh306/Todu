"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { useAuth } from "@/features/auth/providers/auth-provider";

type UserAvatarProps = {
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export const UserAvatar = ({ size = "md" }: UserAvatarProps) => {
  const { user, isLoading } = useAuth();

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
    <Link
      href="/profile"
      className={`${sizeClasses[size]} flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-theme-accent text-white font-medium ring-2 ring-transparent transition hover:ring-theme-primary focus:outline-none focus:ring-theme-primary`}
      aria-label="Profil öffnen"
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
    </Link>
  );
};
