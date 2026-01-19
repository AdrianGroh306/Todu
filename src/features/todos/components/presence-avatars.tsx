"use client";

import { type PresenceUser } from "@/features/todos/hooks/use-polling-todos";

type PresenceAvatarsProps = {
  users: PresenceUser[];
  maxVisible?: number;
  variant?: "stack" | "inline";
  className?: string;
  size?: "sm" | "md" | "lg";
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-teal-500",
];

const getColorForUser = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

const getInitials = (username?: string) => {
  if (!username) return "?";
  return username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const PresenceAvatars = ({
  users,
  maxVisible = 3,
  variant = "stack",
  className = "",
  size = "sm",
}: PresenceAvatarsProps) => {
  if (users.length === 0) return null;

  const visibleUsers = users.slice(0, maxVisible);
  const hiddenCount = Math.max(0, users.length - maxVisible);
  const showLabel = variant === "stack";
  const sizeClass =
    size === "lg" ? "h-11 w-11 text-base" : size === "md" ? "h-9 w-9 text-sm" : "h-6 w-6 text-xs";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel ? <span className="text-xs text-theme-text-muted">Online:</span> : null}
      <div className="flex -space-x-3">
        {visibleUsers.map((user, index) => (
          <div
            key={user.userId}
            className={`${sizeClass} flex items-center justify-center rounded-full font-semibold text-white border border-theme-surface ${getColorForUser(index)}`}
            title={user.username || user.userId}
          >
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.username ?? "Profilbild"}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              getInitials(user.username)
            )}
          </div>
        ))}
        {hiddenCount > 0 ? (
          <div className={`${sizeClass} flex items-center justify-center rounded-full font-semibold text-white bg-theme-text-muted border border-theme-surface`}>
            +{hiddenCount}
          </div>
        ) : null}
      </div>
    </div>
  );
};
