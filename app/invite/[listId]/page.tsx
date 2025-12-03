"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type JoinState = 
  | { status: "loading" }
  | { status: "success"; listName: string }
  | { status: "already-member"; listName: string }
  | { status: "error"; message: string };

export default function InvitePage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const [state, setState] = useState<JoinState>({ status: "loading" });

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Redirect to sign-in with return URL
      const returnUrl = `/invite/${listId}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // User is signed in, try to join the list
    async function joinList() {
      try {
        const response = await fetch(`/api/lists/${listId}/join`, {
          method: "POST",
        });

        const data = await response.json();

        if (response.ok) {
          setState({ status: "success", listName: data.listName });
          // Invalidate lists query so the new list appears
          queryClient.invalidateQueries({ queryKey: ["lists"] });
          // Redirect to home after a short delay
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
  }, [isLoaded, isSignedIn, listId, router, queryClient]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-theme-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-surface p-8 text-center shadow-xl">
        {state.status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-theme-primary" />
            <h1 className="mt-4 text-xl font-semibold text-theme-text">
              Einladung wird verarbeitet…
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
