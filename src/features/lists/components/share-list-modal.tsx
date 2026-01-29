import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Modal } from "@/components/modal";
import type { ListSummary } from "@/features/lists/hooks/use-lists";

type ShareListModalProps = {
  list: ListSummary | null;
  onClose: () => void;
};

export const ShareListModal = ({ list, onClose }: ShareListModalProps) => {
  const [hasCopied, setHasCopied] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteStatus, setInviteStatus] = useState<{
    type: "idle" | "sending" | "success" | "error";
    message?: string;
  }>({ type: "idle" });
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shareUrl = useMemo(() => {
    if (!list) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/invite/${list.id}`;
  }, [list]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!list) {
      setHasCopied(false);
      setInviteUsername("");
      setInviteStatus({ type: "idle" });
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    }
  }, [list]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopied(true);
      resetTimerRef.current = setTimeout(() => {
        setHasCopied(false);
        resetTimerRef.current = null;
      }, 2500);
    } catch (error) {
      console.error("Failed to copy share link", error);
    }
  };

  const handleInvite = async () => {
    if (!list || !inviteUsername.trim()) return;
    setInviteStatus({ type: "sending" });

    try {
      const response = await fetch("/api/list-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: list.id, username: inviteUsername.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setInviteStatus({
          type: "error",
          message: data.error || "Einladung konnte nicht gesendet werden.",
        });
        return;
      }

      setInviteStatus({
        type: "success",
        message: `Einladung an @${data.invitedUsername ?? inviteUsername.trim()} gesendet.`,
      });
      setInviteUsername("");
    } catch (error) {
      console.error("Failed to send invite", error);
      setInviteStatus({ type: "error", message: "Netzwerkfehler beim Einladen." });
    }
  };

  return (
    <Modal open={Boolean(list)} onClose={onClose} title="Liste teilen" fullscreen>
      {list && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-surface">
              <Share2 className="h-5 w-5 text-theme-text" />
            </div>
            <p className="text-base font-semibold text-theme-text">{list.name}</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wide text-theme-text-muted">Per Benutzername</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteUsername}
                onChange={(event) => {
                  setInviteUsername(event.target.value);
                  if (inviteStatus.type !== "idle") {
                    setInviteStatus({ type: "idle" });
                  }
                }}
                placeholder="@username"
                className="flex-1 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-sm text-theme-text outline-none"
              />
              <button
                type="button"
                className="rounded-xl bg-theme-primary px-4 py-3 text-sm font-semibold text-theme-bg transition hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleInvite}
                disabled={inviteStatus.type === "sending" || inviteUsername.trim().length === 0}
              >
                {inviteStatus.type === "sending" ? "Sende…" : "Einladen"}
              </button>
            </div>
            {inviteStatus.type === "success" ? (
              <p className="text-xs text-emerald-400">{inviteStatus.message}</p>
            ) : inviteStatus.type === "error" ? (
              <p className="text-xs text-rose-400">{inviteStatus.message}</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wide text-theme-text-muted">Einladungslink</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-xl border border-theme-border bg-theme-surface px-4 py-3 text-sm text-theme-text outline-none"
              />
              <button
                type="button"
                className="flex h-11 w-11 items-center cursor-pointer justify-center rounded-xl border border-theme-border text-theme-text transition hover:border-theme-primary"
                onClick={handleCopy}
              >
                {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
