"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useActiveList } from "@/components/providers/active-list-provider";

export function ListPicker() {
  const { lists, activeList, setActiveListId, isLoadingLists, createList } = useActiveList();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  const toggleOpen = () => {
    if (isLoadingLists && !activeList) return;
    setIsOpen((prev) => !prev);
  };

  const handleCreateList = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    try {
      const created = await createList.mutateAsync({ name: trimmed });
      setNewListName("");
      setShowCreateForm(false);
      setIsOpen(false);
      setActiveListId(created.id);
    } catch (error) {
      console.error("Failed to create list", error);
    }
  };

  const renderLists = () => {
    if (isLoadingLists) {
      return (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Listen werden geladen…
        </div>
      );
    }

    if (lists.length === 0) {
      return <p className="py-2 text-sm text-slate-400">Noch keine Listen vorhanden.</p>;
    }

    return (
      <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
        {lists.map((list) => (
          <li key={list.id}>
            <button
              type="button"
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-800/80 ${
                list.id === activeList?.id ? "text-4xl font-semibold tracking-[0.35em] text-slate-400" : "text-slate-200"
              }`}
              onClick={() => {
                setActiveListId(list.id);
                setIsOpen(false);
                setShowCreateForm(false);
              }}
            >
              <span>{list.name}</span>
              {list.role !== "owner" && (
                <span className="text-xs uppercase tracking-wide text-slate-500">{list.role}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex items-center gap-2 cursor-pointer bg-slate-900/40a py-2 font-medium text-slate-100 transitio"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-4xl font-semibold tracking-[0.35em] text-slate-400">{activeList?.name ?? (isLoadingLists ? "Listen laden…" : "Liste wählen")}</span>
        <ChevronsUpDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-950/95 p-3 shadow-2xl">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Deine Listen</div>
          {renderLists()}
          <div className="mt-3 border-t border-slate-800 pt-3">
            {showCreateForm ? (
              <form className="space-y-2" onSubmit={handleCreateList}>
                <input
                  type="text"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-400"
                  placeholder="Neue Liste"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 text-sm">
                  <button
                    type="button"
                    className="text-slate-400 transition hover:text-slate-200"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewListName("");
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={!newListName.trim() || createList.isPending}
                  >
                    {createList.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Speichern
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700/60 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="h-4 w-4" />
                Neue Liste
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
