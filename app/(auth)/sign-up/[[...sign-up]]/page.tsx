import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-16">
      <div className="rounded-box bg-base-100 p-4 shadow-lg">
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#2563eb",
            },
            elements: {
              formButtonPrimary: "btn btn-primary",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </main>
  );
}
