"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/providers/auth-provider";

export default function SignIn() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      const pendingInvite = sessionStorage.getItem("pendingInvite");
      if (pendingInvite) {
        sessionStorage.removeItem("pendingInvite");
        router.replace(`/invite/${pendingInvite}`);
      } else {
        router.replace("/");
      }
    }
  }, [isLoading, user, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!identifier.trim()) {
      setError("Bitte E-Mail oder Benutzername eingeben");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Anmeldung fehlgeschlagen");
        setIsSubmitting(false);
        return;
      }
      await refreshUser();
      router.push("/");
    } catch (err) {
      console.error("Sign-in: login failed", err);
      setError("Serverfehler bei der Anmeldung");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <span className="loading loading-spinner loading-md text-theme-muted" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-theme-bg px-6">
      <div className="w-full max-w-xs">
        {/* Logo / App Name */}
        <h1 className="text-4xl font-bold text-theme-text text-center mb-12 tracking-tight">
          TODU
        </h1>

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border rounded-xl text-theme-text placeholder-theme-muted/60 focus:outline-none focus:border-theme-accent transition-colors"
            placeholder="E-Mail oder Benutzername"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border rounded-xl text-theme-text placeholder-theme-muted/60 focus:outline-none focus:border-theme-accent transition-colors"
            placeholder="Passwort"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-3.5 bg-theme-primary text-theme-bg font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Anmelden..." : "Anmelden"}
          </button>
        </form>

        <p className="text-center text-theme-muted text-sm mt-8">
          Noch kein Konto?{" "}
          <a href="/sign-up" className="text-theme-primary hover:underline">
            Registrieren
          </a>
        </p>
      </div>
    </main>
  );
}
