"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/modal";
import { useAuth } from "@/features/auth/providers/auth-provider";

type PendingInvite = {
  id: string;
  listId: string;
  listName: string;
  inviterUsername: string | null;
  createdAt: string;
};

export const PendingInviteModal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isHandling, setIsHandling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ invite: PendingInvite | null }>({
    queryKey: ["list-invites", "latest"],
    queryFn: async () => {
      const response = await fetch("/api/list-invites/latest");
      if (!response.ok) {
        throw new Error("Failed to load invite");
      }
      return response.json();
    },
    enabled: Boolean(user),
    refetchInterval: 30 * 1000,
  });

  const invite = data?.invite ?? null;

  const handleRespond = async (action: "accept" | "decline") => {
    if (!invite || isHandling) return;
    setIsHandling(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/list-invites/${invite.id}/${action}`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        setErrorMessage(payload.error || "Aktion fehlgeschlagen.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["lists"] });
      await queryClient.invalidateQueries({ queryKey: ["list-invites", "latest"] });
    } catch (error) {
      console.error("Failed to handle invite", error);
      setErrorMessage("Netzwerkfehler bei der Einladung.");
    } finally {
      setIsHandling(false);
    }
  };

  if (!user || isLoading || !invite) return null;

  return (
    <Modal
      open
      onClose={() => handleRespond("decline")}
      title="Liste beitreten?"
    >
      <div className="space-y-4 text-sm text-theme-text">
        <p>
          Du wurdest eingeladen, der Liste <strong>{invite.listName}</strong> beizutreten.
        </p>
        {invite.inviterUsername ? (
          <p className="text-theme-text-muted">Einladung von @{invite.inviterUsername}</p>
        ) : null}
        {errorMessage ? <p className="text-rose-400">{errorMessage}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl bg-theme-primary px-5 py-2 text-sm font-semibold text-theme-bg transition hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => handleRespond("accept")}
            disabled={isHandling}
          >
            Beitreten
          </button>
          <button
            type="button"
            className="rounded-xl border border-theme-border px-5 py-2 text-sm font-semibold text-theme-text transition hover:border-theme-primary hover:text-theme-primary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => handleRespond("decline")}
            disabled={isHandling}
          >
            Ablehnen
          </button>
        </div>
      </div>
    </Modal>
  );
};
