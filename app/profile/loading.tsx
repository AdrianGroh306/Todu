import { BellRing, Edit, LogOut, Mail, User, X } from "lucide-react";

export default function ProfileLoading() {
  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col overflow-y-auto px-4 pt-4 pb-8 safe-top text-theme-text">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Profil</h1>
        <div
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-surface text-theme-text"
        >
          <X className="h-5 w-5" />
        </div>
      </div>

      {/* Benutzerinformationen */}
      <section className="mb-8 rounded-2xl border border-theme-border bg-theme-surface p-6">
        <h2 className="mb-6 text-xl font-semibold">Benutzerinformationen</h2>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-theme-border bg-theme-surface text-lg font-semibold text-theme-text">
                <div className="h-full w-full animate-pulse rounded-full bg-theme-border" />
              </div>
              <div
                aria-hidden="true"
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-theme-border bg-theme-primary text-theme-border shadow-lg"
              >
                <Edit className="h-4 w-4" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-theme-text">Profilbild</p>
              <p className="text-xs text-theme-text-muted">Tippen zum Ändern (bis 2MB)</p>
            </div>
          </div>

          {/* Benutzername */}
          <div className="flex items-center gap-4">
            <User className="h-5 w-5 text-theme-text-muted" />
            <div className="flex-1">
              <p className="text-sm text-theme-text-muted">Benutzername</p>
              <div className="h-6 w-32 animate-pulse rounded bg-theme-border" />
            </div>
          </div>

          {/* E-Mail */}
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-theme-text-muted" />
            <div className="flex-1">
              <p className="text-sm text-theme-text-muted">E-Mail</p>
              <div className="h-6 w-48 animate-pulse rounded bg-theme-border" />
            </div>
          </div>

          {/* Registrierungsdatum */}
          <div className="text-sm text-theme-text-muted">
            <div className="h-4 w-40 animate-pulse rounded bg-theme-border" />
          </div>
        </div>
      </section>

      {/* Design */}
      <section className="mb-8 rounded-2xl border border-theme-border bg-theme-surface p-6">
        <h2 className="mb-6 text-xl font-semibold">Design</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {["Hell", "Dunkel", "System", "Kontrast"].map((label) => (
              <div
                key={label}
                className="rounded-xl border border-theme-border px-4 py-2 font-medium text-theme-text"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benachrichtigungen */}
      <section className="mb-8 rounded-2xl border border-theme-border bg-theme-surface p-6">
        <h2 className="mb-6 text-xl font-semibold">Benachrichtigungen</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <BellRing className="h-5 w-5 text-theme-text-muted" />
            <div className="flex-1">
              <p className="text-sm text-theme-text-muted">Status</p>
              <p className="text-lg font-medium text-theme-text">Nicht aktiviert</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl bg-theme-primary px-4 py-2 font-medium text-theme-bg">
              Aktivieren
            </div>
            <div className="rounded-xl border border-theme-border px-4 py-2 font-medium text-theme-text">
              Test senden
            </div>
          </div>
        </div>
      </section>

      {/* Abmelden */}
      <section className="flex justify-center rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6">
        <div className="flex items-center gap-2 rounded-xl bg-rose-500 px-6 py-3 font-semibold text-white">
          <LogOut className="h-5 w-5" />
          Abmelden
        </div>
      </section>
    </main>
  );
}
