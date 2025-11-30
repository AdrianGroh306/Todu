import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-16">
			<div className="rounded-box bg-base-100 p-4 shadow-lg">
				<SignIn
					appearance={{
						variables: { colorPrimary: "#2563eb" },
						elements: { formButtonPrimary: "btn btn-primary" },
					}}
					routing="path"
					path="/sign-in"
					signUpUrl="/sign-up"
				/>
			</div>
		</main>
	);
}
