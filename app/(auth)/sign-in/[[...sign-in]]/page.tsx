"use client";

import { useEffect } from "react";
import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignInPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoaded || !isSignedIn) return;

		// Check for pending invite
		const pendingInvite = sessionStorage.getItem("pendingInvite");
		if (pendingInvite) {
			sessionStorage.removeItem("pendingInvite");
			router.push(`/invite/${pendingInvite}`);
		} else {
			router.push("/");
		}
	}, [isLoaded, isSignedIn, router]);

	// Don't render SignIn if user is already signed in or still loading
	if (!isLoaded || isSignedIn) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-theme-bg px-4 py-16">
				<p className="text-theme-text-muted">Weiterleitung…</p>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-theme-bg px-4 py-16">
			<div className="rounded-2xl bg-theme-surface p-4 shadow-lg">
				<SignIn
					appearance={{
						variables: { colorPrimary: "#2563eb" },
						elements: { 
							formButtonPrimary: "btn btn-primary",
							rootBox: { 
								'& > div:first-child': { display: 'none' } // Hide dev mode badge
							}
						},
					}}
					afterSignInUrl="/"
					afterSignUpUrl="/"
					signUpUrl="/sign-up"
				/>
			</div>
		</main>
	);
}
