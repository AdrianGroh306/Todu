"use client";

import { LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { Modal } from "@/components/ui/modal";
import { THEMES, useTheme, type ThemeId } from "@/components/providers/theme-provider";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useClerk();

  const handleThemeSelect = (themeId: ThemeId) => {
    setTheme(themeId);
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Einstellungen">
      <div className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-theme-text-muted">Design</h3>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeSelect(t.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition ${
                  theme === t.id
                    ? "bg-theme-surface ring-2 ring-theme-primary"
                    : "hover:bg-theme-surface/50"
                }`}
                title={t.name}
              >
                <div
                  className={`h-8 w-8 rounded-full ${t.preview} ring-1 ring-white/20`}
                />
                <span className="text-xs text-theme-text-muted">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-theme-border" />

        {/* Logout */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Abmelden
          </button>
        </div>
      </div>
    </Modal>
  );
}
