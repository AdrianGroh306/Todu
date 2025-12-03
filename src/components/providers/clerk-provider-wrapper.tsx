"use client";

import { ClerkProvider } from "@clerk/nextjs";

type Props = {
  children: React.ReactNode;
};

export function ClerkProviderWrapper({ children }: Props) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
