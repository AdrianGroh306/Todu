import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-10 px-4 py-20">
      <div className="space-y-6">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
          Clarydo
        </p>
        <h1 className="text-5xl font-semibold text-slate-900">
          Fokus auf das Wesentliche.
        </h1>
        <p className="text-lg text-slate-600">
          Baue Schritt für Schritt deine persönliche Produktivitätszentrale.
          Starte mit einer einfachen Todo-Liste und erweitere später um
          Synchronisierung, Auth und mehr.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/todos"
          className="rounded-xl bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800"
        >
          Todo-Liste öffnen
        </Link>
      </div>
    </main>
  );
}
