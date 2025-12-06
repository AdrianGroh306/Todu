"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type JoinState = 
  | { status: "loading" }
  | { status: "joining" }
  | { status: "success"; listName: string }
  | { status: "already-member"; listName: string }
  | { status: "error"; message: string };

export default function InvitePage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<JoinState>({ status: "loading" });
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

  useEffect(() => {
    if (isLoading || hasAttemptedJoin) return;

    if (!user) {
      // Store the invite URL and redirect to sign-in
      sessionStorage.setItem("pendingInvite", listId);
      router.push("/sign-in");
      return;
    }

    // User is signed in, try to join the list
    setHasAttemptedJoin(true);
    setState({ status: "joining" });

    async function joinList() {
      try {
        const response = await fetch(`/api/lists/${listId}/join`, {
          method: "POST",
        });

        const data = await response.json();

        if (response.ok) {
          setState({ status: "success", listName: data.listName });
          queryClient.invalidateQueries({ queryKey: ["lists"] });
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else if (response.status === 400 && data.error?.includes("already")) {
          setState({ status: "already-member", listName: data.listName });
          setTimeout(() => {
            router.push("/");
          }, 2000);
        } else if (response.status === 404) {
          setState({ status: "error", message: "Diese Liste existiert nicht." });
        } else {
          setState({ status: "error", message: data.error || "Fehler beim Beitreten" });
        }
      } catch (error) {
        console.error("Failed to join list", error);
        setState({ status: "error", message: "Netzwerkfehler beim Beitreten" });
      }
    }

    joinList();
  }, [isLoading, user, listId, router, queryClient, hasAttemptedJoin]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-theme-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-surface p-8 text-center shadow-xl">
        {(state.status === "loading" || state.status === "joining") && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-theme-primary" />
            <h1 className="mt-4 text-xl font-semibold text-theme-text">
              {state.status === "joining" ? "Trete Liste bei…" : "Einladung wird verarbeitet…"}
            </h1>
            <p className="mt-2 text-sm text-theme-text-muted">
              Bitte warte einen Moment.
            </p>
          </>
        )}

        {state.status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-4 text-xl font-semibold text-theme-text">
              Erfolgreich beigetreten!
            </h1>
            <p className="mt-2 text-sm text-theme-text-muted">
              Du bist jetzt Mitglied der Liste <strong>{state.listName}</strong>.
            </p>
            <p className="mt-4 text-xs text-theme-text-muted">
              Du wirst gleich weitergeleitet…
            </p>
          </>
        )}

        {state.status === "already-member" && (
          <>
            <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 text-xl font-semibold text-theme-text">
              Bereits Mitglied
            </h1>
            <p className="mt-2 text-sm text-theme-text-muted">
              Du bist bereits Mitglied der Liste <strong>{state.listName}</strong>.
            </p>
            <p className="mt-4 text-xs text-theme-text-muted">
              Du wirst gleich weitergeleitet…
            </p>
          </>
        )}

        {state.status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-rose-500" />
            <h1 className="mt-4 text-xl font-semibold text-theme-text">
              Fehler
            </h1>
            <p className="mt-2 text-sm text-theme-text-muted">
              {state.message}
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 rounded-xl bg-theme-primary px-6 py-2 text-sm font-medium text-theme-bg transition hover:bg-theme-primary-hover"
            >
              Zur Startseite
            </button>
          </>
        )}
      </div>
    </main>
  );
}
