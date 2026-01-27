"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { Check, Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setUsernameError("Nur Buchstaben, Zahlen und _");
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
      setError("Bitte gültigen Benutzernamen eingeben");
      return;
    }

    if (usernameAvailable === false) {
      setError("Benutzername bereits vergeben");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    if (password.length < 6) {
      setError("Passwort muss mind. 6 Zeichen haben");
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
        setError("Fehler beim Speichern");
        setIsSubmitting(false);
        return;
      }
    }

    setEmailSent(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <span className="loading loading-spinner loading-md text-theme-muted" />
      </div>
    );
  }

  if (emailSent) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-theme-bg px-6">
        <div className="w-full max-w-xs text-center">
          <div className="w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-theme-text mb-3">E-Mail bestätigen</h1>
          <p className="text-theme-muted text-sm mb-8">
            Wir haben eine E-Mail an <span className="text-theme-text">{email}</span> gesendet.
          </p>
          <a href="/sign-in" className="text-theme-accent text-sm hover:underline">
            Zurück zur Anmeldung
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-theme-bg px-6">
      <div className="w-full max-w-xs">
        {/* Logo / App Name */}
        <h1 className="text-4xl font-bold text-theme-text text-center mb-12 tracking-tight">
          TODU
        </h1>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3.5 bg-theme-surface border border-theme-border rounded-xl text-theme-text placeholder-theme-muted/60 focus:outline-none focus:border-theme-accent transition-colors"
            placeholder="E-Mail"
          />

          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => handleCheckUsername(e.target.value)}
              required
              autoComplete="username"
              className={`w-full px-4 py-3.5 bg-theme-surface border rounded-xl text-theme-text placeholder-theme-muted/60 focus:outline-none transition-colors ${
                usernameError
                  ? "border-red-500/70 focus:border-red-500"
                  : usernameAvailable === true
                  ? "border-green-500/70 focus:border-green-500"
                  : usernameAvailable === false
                  ? "border-red-500/70 focus:border-red-500"
                  : "border-theme-border focus:border-theme-accent"
              }`}
              placeholder="Benutzername"
            />
            {usernameAvailable === true && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>
          {(usernameError || usernameAvailable === false) && (
            <p className="text-red-400 text-xs -mt-2 ml-1">
              {usernameError || "Bereits vergeben"}
            </p>
          )}

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3.5 pr-12 bg-theme-surface border border-theme-border rounded-xl text-theme-text placeholder-theme-muted/60 focus:outline-none focus:border-theme-accent transition-colors"
              placeholder="Passwort"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5 cursor-pointer text-theme-primary" /> : <Eye className="w-5 h-5 cursor-pointer text-theme-primary" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3.5 pr-12 bg-theme-surface border border-theme-border rounded-xl text-theme-text placeholder-theme-muted/60 focus:outline-none focus:border-theme-accent transition-colors"
              placeholder="Passwort bestätigen"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5 cursor-pointer text-theme-primary" /> : <Eye className="w-5 h-5 cursor-pointer text-theme-primary" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 mt-5 bg-theme-primary text-theme-bg font-medium rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "Registrieren..." : "Registrieren"}
          </button>
        </form>

        <p className="text-center text-theme-muted text-sm mt-8">
          Bereits ein Konto?{" "}
          <a href="/sign-in" className="text-theme-primary hover:underline">
            Anmelden
          </a>
        </p>
      </div>
    </main>
  );
}
