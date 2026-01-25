"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/providers/auth-provider";

export default function SignUp() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const supabase = createClient();

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

  const handleCheckUsername = async (value: string) => {
    setUsername(value);

    if (value.length < 2) {
      setUsernameError("Mindestens 2 Zeichen");
      setUsernameAvailable(null);
      return;
    }

    if (value.length > 20) {
      setUsernameError("Maximal 20 Zeichen");
      setUsernameAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Nur Buchstaben, Zahlen und Unterstriche");
      setUsernameAvailable(null);
      return;
    }

    setUsernameError(null);

    const response = await fetch("/api/auth/check-username", {
      method: "POST",
      body: JSON.stringify({ username: value }),
    });

    const data = await response.json();
    setUsernameAvailable(data.available);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || usernameError) {
      setError("Bitte geben Sie einen gültigen Benutzernamen ein");
      return;
    }

    if (usernameAvailable === false) {
      setError("Dieser Benutzername ist bereits vergeben");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein");
      return;
    }

    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    setIsSubmitting(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    if (authData.user?.id) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{ id: authData.user.id, username: username.toLowerCase() }]);

      if (profileError) {
        setError("Fehler beim Speichern des Benutzernamens");
        setIsSubmitting(false);
        return;
      }
    }

    setEmailSent(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <div className="text-theme-muted">Laden...</div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-theme-bg px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="bg-theme-surface border border-theme-border rounded-2xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-theme-text mb-2">E-Mail bestätigen</h1>
            <p className="text-theme-muted mb-6">
              Wir haben eine E-Mail an <strong className="text-theme-text">{email}</strong> gesendet.
              Klicke auf den Link, um dein Konto zu aktivieren.
            </p>
            <a href="/sign-in" className="text-theme-accent font-medium hover:underline cursor-pointer">Zurück zur Anmeldung</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-theme-bg px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-theme-surface border border-theme-border rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-theme-text">Clarydo</h1>
            <p className="text-theme-muted text-sm mt-1">Erstelle dein Konto</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-theme-muted mb-1.5">E-Mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-theme-bg border border-theme-border rounded-xl text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                placeholder="deine@email.de"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-theme-muted mb-1.5">Benutzername</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => handleCheckUsername(e.target.value)}
                required
                className={`w-full px-4 py-3 bg-theme-bg border rounded-xl text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent ${
                  usernameError ? "border-red-500" : usernameAvailable === true ? "border-green-500" : "border-theme-border"
                }`}
                placeholder="dein_benutzername"
              />
              {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
              {usernameAvailable === true && <p className="text-green-500 text-sm mt-1">Verfügbar ✓</p>}
              {usernameAvailable === false && !usernameError && <p className="text-red-500 text-sm mt-1">Bereits vergeben</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-theme-muted mb-1.5">Passwort</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-theme-bg border border-theme-border rounded-xl text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-muted mb-1.5">Passwort bestätigen</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-theme-bg border border-theme-border rounded-xl text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-lg">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-theme-accent text-white font-semibold rounded-xl border-2 border-theme-accent hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-theme-accent/25 cursor-pointer"
            >
              {isSubmitting ? "Wird registriert..." : "Registrieren"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-theme-muted text-sm">
              Bereits ein Konto?{" "}
              <a href="/sign-in" className="text-theme-accent font-medium hover:underline cursor-pointer">Anmelden</a>
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
