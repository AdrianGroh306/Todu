import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerClient } from "@/components/service-worker-client";
import { QueryClientProviderWrapper } from "@/components/query-client-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Clarydo",
    template: "%s · Clarydo",
  },
  description:
    "Clarydo ist deine minimalistische Todo-App, die sich Schritt für Schritt zur persönlichen Produktivitätszentrale ausbauen lässt.",
  applicationName: "Clarydo",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

type ProviderProps = { children: React.ReactNode };

function OptionalClerkProvider({ children }: ProviderProps) {
  if (!clerkPublishableKey) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {children}
    </ClerkProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <OptionalClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-100 antialiased`}
        >
          <QueryClientProviderWrapper>
            {children}
            <ServiceWorkerClient />
          </QueryClientProviderWrapper>
        </body>
      </html>
    </OptionalClerkProvider>
  );
}
