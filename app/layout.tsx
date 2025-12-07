import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ServiceWorkerClient } from "@/features/shared/service-worker-client";
import { QueryClientProviderWrapper } from "@/features/shared/providers/query-client-provider";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { ActiveListProvider } from "@/features/shared/providers/active-list-provider";
import { ThemeProvider } from "@/features/shared/providers/theme-provider";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-theme-bg text-theme-text antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <QueryClientProviderWrapper>
              <ActiveListProvider>
                {children}
                <ServiceWorkerClient />
              </ActiveListProvider>
            </QueryClientProviderWrapper>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
