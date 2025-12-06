"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function SignInPage() {
	const router = useRouter();
	const { user, isLoading } = useAuth();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Redirect if already signed in (using useEffect to avoid hydration issues)
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
				<div className="text-theme-muted">Laden...</div>
			</div>
		);
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-theme-bg px-4 py-16">
			<div className="w-full max-w-sm">
				<div className="bg-theme-surface border border-theme-border rounded-2xl p-8 shadow-xl">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-theme-text">Clarydo</h1>
						<p className="text-theme-muted text-sm mt-1">Willkommen zurück</p>
					</div>

					<form onSubmit={handleSignIn} className="space-y-4">
						<div>
							<label htmlFor="identifier" className="block text-sm font-medium text-theme-muted mb-1.5">
								E-Mail oder Benutzername
							</label>
							<input
								id="identifier"
								type="text"
								value={identifier}
								onChange={(e) => setIdentifier(e.target.value)}
								required
								className="w-full px-4 py-3 bg-theme-bg border border-theme-border rounded-xl text-theme-text placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-transparent"
								placeholder="dein_benutzername oder email"
							/>
						</div>

						<div>
							<label htmlFor="password" className="block text-sm font-medium text-theme-muted mb-1.5">
								Passwort
							</label>
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

						{error && (
							<div className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-lg">
								{error}
							</div>
						)}

						<button
							type="submit"
							disabled={isSubmitting}
							className="w-full py-3 px-4 bg-theme-accent text-white font-semibold rounded-xl border-2 border-theme-accent hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-theme-accent/25"
						>
							{isSubmitting ? "Wird angemeldet..." : "Anmelden"}
						</button>
					</form>

					<div className="mt-6 text-center">
						<span className="text-theme-muted text-sm">
							Noch kein Konto?{" "}
							<a href="/sign-up" className="text-theme-accent font-medium hover:underline">
								Registrieren
							</a>
						</span>
					</div>
				</div>
			</div>
		</main>
	);
}
