"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, User, Edit, Bell, BellOff, BellRing } from "lucide-react";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useTheme, THEMES, type ThemeId } from "@/features/shared/providers/theme-provider";
import { useWebPush } from "@/features/shared/hooks/use-web-push";
import { createClient } from "@/lib/supabase/client";
import type { ProfileData } from "@/lib/data/profile";
import { CloseButton } from "@/components/close-button";

type ProfilePageProps = {
  initialProfile: ProfileData | null;
  onClose?: () => void;
};

export const ProfilePage = ({ initialProfile, onClose }: ProfilePageProps) => {
  const router = useRouter();
  const supabase = createClient();
  const { user, signOut, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isSupported: pushSupported, isSubscribed, isLoading: pushLoading, permission, subscribe, unsubscribe } = useWebPush();

  // Use server-fetched data as initial state - no loading needed!
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile?.avatarUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isTogglingPush, setIsTogglingPush] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Username comes from server - no useQuery needed
  const username = initialProfile?.username ?? null;

  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url as string);
    }
  }, [user?.user_metadata?.avatar_url]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploadError(null);

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Bild darf maximal 2MB groß sein.");
      return;
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "";
    const fileName = `avatar.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    setUploading(true);

    const { error: uploadErr } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });

    if (uploadErr) {
      console.error("Avatar upload error:", uploadErr);
      setUploadError("Upload fehlgeschlagen. Bitte erneut versuchen.");
      setUploading(false);
      return;
    }

    const extensions = ["png", "jpg", "jpeg", "webp", "gif"];
    for (const ext of extensions) {
      if (ext !== fileExt) {
        const oldPath = `${user.id}/avatar.${ext}`;
        await supabase.storage.from("avatars").remove([oldPath]);
      }
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    let publicUrl = data?.publicUrl ?? null;

    if (!publicUrl) {
      setUploadError("Konnte Bild-URL nicht lesen.");
      setUploading(false);
      return;
    }

    publicUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (updateErr) {
      console.error("Auth update error:", updateErr);
      setUploadError("Profil konnte nicht aktualisiert werden.");
      setUploading(false);
      return;
    }

    await refreshUser();
    setAvatarUrl(publicUrl);
    setUploading(false);
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleTogglePush = async () => {
    if (isTogglingPush) return;
    setIsTogglingPush(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (isSendingTest) return;
    setIsSendingTest(true);
    try {
      await fetch("/api/test-push", { method: "POST" });
    } finally {
      setIsSendingTest(false);
    }
  };

  const avatarFallback = useMemo(
    () => (initialProfile?.email?.charAt(0) ?? user?.email?.charAt(0) ?? "").toUpperCase(),
    [initialProfile?.email, user?.email]
  );

  const displayEmail = initialProfile?.email ?? user?.email ?? "";
  const displayCreatedAt = initialProfile?.createdAt ?? user?.created_at ?? "";

  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col overflow-y-auto px-4 pt-4 pb-8 safe-top text-theme-text">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Profil</h1>
        <CloseButton onClick={handleClose} ariaLabel="Profil schließen" />
      </div>

      {/* Benutzerinformationen */}
      <section className="mb-8 rounded-2xl bg-theme-surface p-6">
        <h2 className="mb-6 text-xl font-semibold">Benutzerinformationen</h2>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-theme-surface text-lg font-semibold text-theme-text">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profilbild"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarFallback || <User className="h-6 w-6" />
                )}
              </div>
              <button
                type="button"
                onClick={triggerAvatarUpload}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-theme-primary text-theme-bg shadow-lg transition hover:bg-theme-primary-hover disabled:opacity-60"
                aria-label="Profilbild ändern"
              >
                <Edit className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-theme-text">Profilbild</p>
              <p className="text-xs text-theme-text-muted">Tippen zum Ändern (bis 2MB)</p>
              {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
            </div>
          </div>

          {/* Benutzername */}
          <div className="flex items-center gap-4">
            <User className="h-5 w-5 text-theme-text-muted" />
            <div className="flex-1">
              <p className="text-sm text-theme-text-muted">Benutzername</p>
              <p className="text-lg font-medium text-theme-text">
                {username || "Nicht gesetzt"}
              </p>
            </div>
          </div>

          {/* E-Mail */}
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-theme-text-muted" />
            <div className="flex-1">
              <p className="text-sm text-theme-text-muted">E-Mail</p>
              <p className="text-lg font-medium text-theme-text">{displayEmail}</p>
            </div>
          </div>

          {/* Registrierungsdatum */}
          {displayCreatedAt && (
            <div className="text-sm text-theme-text-muted">
              <p>Registriert am: {new Date(displayCreatedAt).toLocaleDateString("de-DE")}</p>
            </div>
          )}
        </div>
        <h2 className="mb-6 mt-8 text-xl font-semibold">Design</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as ThemeId)}
                className={`cursor-pointer rounded-xl px-4 py-2 font-medium transition ${theme === t.id
                    ? "bg-theme-primary text-theme-bg"
                    : "border border-theme-border text-theme-text hover:border-theme-primary"
                  }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center pt-16">
          <button
            onClick={handleSignOut}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 font-semibold text-white transition hover:bg-rose-600 active:scale-95"
          >
            <LogOut className="h-5 w-5" />
            Abmelden
          </button>
        </div>

      </section>


      {/* App-Version */}
      <section className="mb-8 rounded-2xl bg-theme-surface p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-theme-text-muted">App-Version</p>
          <p className="text-sm font-medium text-theme-text">
            {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}
          </p>
        </div>
      </section>

      {/* Benachrichtigungen - immer anzeigen */}
      <section className="rounded-2xl bg-theme-surface p-6">
        <h2 className="mb-6 text-xl font-semibold">Benachrichtigungen</h2>
        {pushLoading ? (
          <p className="text-sm text-theme-text-muted">Laden...</p>
        ) : !pushSupported ? (
          <div className="flex items-center gap-4">
            <BellOff className="h-5 w-5 text-theme-text-muted" />
            <p className="text-sm text-theme-text-muted">
              Push-Benachrichtigungen werden auf diesem Gerät nicht unterstützt.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {permission === "granted" ? (
                <Bell className="h-5 w-5 text-emerald-400" />
              ) : permission === "denied" ? (
                <BellOff className="h-5 w-5 text-rose-400" />
              ) : (
                <BellRing className="h-5 w-5 text-theme-text-muted" />
              )}
              <div className="flex-1">
                <p className="text-sm text-theme-text-muted">Status</p>
                <p className="text-lg font-medium text-theme-text">
                  {permission === "granted"
                    ? "Aktiv"
                    : permission === "denied"
                      ? "Blockiert"
                      : "Nicht aktiviert"}
                </p>
              </div>
            </div>

            {permission === "denied" ? (
              <p className="text-sm text-theme-text-muted">
                Benachrichtigungen wurden blockiert. Erlaube sie in den Einstellungen deines Geräts.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleTogglePush}
                  disabled={isTogglingPush}
                  className={`cursor-pointer rounded-xl px-4 py-2 font-medium transition disabled:opacity-60 ${isSubscribed
                      ? "border border-theme-border text-theme-text hover:border-rose-500 hover:text-rose-500"
                      : "bg-theme-primary text-theme-bg hover:bg-theme-primary-hover"
                    }`}
                >
                  {isSubscribed
                    ? "Deaktivieren"
                    : "Aktivieren"}
                </button>

                {isSubscribed ? (
                  <button
                    onClick={handleSendTestNotification}
                    disabled={isSendingTest}
                    className="cursor-pointer rounded-xl border border-theme-border px-4 py-2 font-medium text-theme-text transition hover:border-theme-primary disabled:opacity-60"
                  >
                    Test senden
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}
      </section>

    </main>
  );
};
