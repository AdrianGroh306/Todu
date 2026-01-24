export default function CompletedLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-theme-bg pt-safe">
      <main className="mx-auto flex h-full max-w-3xl flex-col px-4 pt-2">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between py-4">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-theme-surface" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 animate-pulse rounded bg-theme-surface" />
            <div className="h-6 w-36 animate-pulse rounded-lg bg-theme-surface" />
          </div>
          <div className="w-8" />
        </header>
        {/* Content */}
        <section className="flex flex-1 min-h-0 flex-col gap-4">
          <div className="flex-1 min-h-0 rounded-2xl bg-theme-surface/80 p-4 backdrop-blur">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-theme-border" />
                  <div className="h-5 w-5 animate-pulse rounded bg-theme-border" />
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* Footer */}
        <footer className="shrink-0 py-4 pb-6">
          <div className="mx-auto h-12 w-32 animate-pulse rounded-full bg-theme-surface" />
        </footer>
      </main>
    </div>
  );
}
