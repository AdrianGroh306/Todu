import { BellOff, BellRing, CheckCircle2 } from "lucide-react";

type NotificationBannerProps = {
  variant: "prompt" | "enabled" | "blocked";
  onEnable?: () => void;
  onTest?: () => void;
  isRequesting?: boolean;
  isTesting?: boolean;
  pendingTodos?: number;
};

const descriptions = {
  prompt: "Aktiviere Mitteilungen, um auch außerhalb der App an offene Todos erinnert zu werden.",
  enabled:
    "Benachrichtigungen sind aktiv. Du kannst jederzeit eine Testbenachrichtigung senden, um sicherzustellen, dass alles funktioniert.",
  blocked:
    "Benachrichtigungen wurden im Browser blockiert. Erlaube sie in den iOS-Einstellungen (Einstellungen → Safari → Benachrichtigungen), um Erinnerungen zu erhalten.",
};

export const NotificationBanner = ({
  variant,
  onEnable,
  onTest,
  isRequesting = false,
  isTesting = false,
  pendingTodos = 0,
}: NotificationBannerProps) => {
  const isPrompt = variant === "prompt";
  const isEnabled = variant === "enabled";
  const Icon = variant === "enabled" ? CheckCircle2 : variant === "blocked" ? BellOff : BellRing;

  return (
    <div className="rounded-2xl border border-theme-border/60 bg-theme-surface/70 px-4 py-3 text-sm text-theme-text shadow-lg shadow-black/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className={`mt-0.5 h-5 w-5 ${isEnabled ? "text-emerald-400" : "text-theme-primary"}`} />
          <div>
            <p className="font-semibold">
              {isPrompt
                ? "Benachrichtigungen aktivieren"
                : isEnabled
                  ? "Benachrichtigungen aktiv"
                  : "Benachrichtigungen blockiert"}
            </p>
            <p className="mt-1 text-xs text-theme-text-muted sm:text-sm">
              {isEnabled && pendingTodos > 0
                ? `Aktuell warten ${pendingTodos} unerledigte ${pendingTodos === 1 ? "Aufgabe" : "Aufgaben"} auf dich.`
                : descriptions[variant]}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isPrompt && onEnable ? (
            <button
              type="button"
              className="rounded-xl bg-theme-primary px-4 py-2 text-sm font-semibold text-theme-bg transition hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onEnable}
              disabled={isRequesting}
            >
              {isRequesting ? "Aktiviere…" : "Jetzt aktivieren"}
            </button>
          ) : null}
          {isEnabled && onTest ? (
            <button
              type="button"
              className="rounded-xl border border-theme-border/70 px-4 py-2 text-sm font-semibold text-theme-text transition hover:border-theme-primary hover:text-theme-primary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onTest}
              disabled={isTesting}
            >
              {isTesting ? "Sende…" : "Testbenachrichtigung"}
            </button>
          ) : null}
          {variant === "blocked" ? (
            <span className="text-xs text-theme-text-muted">
              Öffne die Safari-Einstellungen und erlaube Clarydo Mitteilungen.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
