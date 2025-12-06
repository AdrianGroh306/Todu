import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { ListSummary } from "@/hooks/use-lists";

type ShareListModalProps = {
  list: ListSummary | null;
  onClose: () => void;
};

export function ShareListModal({ list, onClose }: ShareListModalProps) {
  const [hasCopied, setHasCopied] = useState(false);
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

  return (
    <Modal open={Boolean(list)} onClose={onClose} title="Liste teilen">
      {list && (
        <div className="space-y-4">
          <p className="text-sm text-theme-text-muted">
            Teile diesen Link, damit andere deiner Liste <strong>{list.name}</strong> beitreten können.
          </p>
          <div className="flex flex-col gap-2">
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
