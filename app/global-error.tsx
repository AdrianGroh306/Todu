"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0f172a] px-6 text-center text-white">
        <p className="text-lg font-semibold">Etwas ist schiefgelaufen</p>
        <p className="text-sm text-white/70">
          Todu konnte nicht geladen werden. Ein Neustart hilft meistens.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0f172a]"
        >
          Neu laden
        </button>
      </body>
    </html>
  );
}
