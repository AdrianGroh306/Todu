"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { ChevronsUpDown, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useActiveList } from "@/components/providers/active-list-provider";
import type { ListSummary } from "@/hooks/use-lists";

const MAX_LIST_NAME_LENGTH = 40;
const LONG_PRESS_MS = 500;

export function ListPicker() {
    const {
        lists,
        activeList,
        setActiveListId,
        isLoadingLists,
        createList,
        renameList,
        deleteList,
    } = useActiveList();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [actionList, setActionList] = useState<ListSummary | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const selectableLists = lists.filter((list) => list.id !== activeList?.id);

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

    const closeListModal = () => {
        setIsOpen(false);
        setShowCreateForm(false);
    };

    const handleCreateList = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = newListName.trim();
        if (!trimmed) return;
        try {
            const created = await createList.mutateAsync({ name: trimmed });
            setNewListName("");
            closeListModal();
            setActiveListId(created.id);
        } catch (error) {
            console.error("Failed to create list", error);
        }
    };

    const handleListLongPress = (list: ListSummary) => {
        closeListModal();
        setActionList(list);
        setRenameValue(list.name);
    };

    const closeActionModal = () => {
        setActionList(null);
        setRenameValue("");
    };

    const handleRenameSubmit = () => {
        if (!actionList || actionList.role !== "owner") return;
        const trimmed = renameValue.trim();
        if (!trimmed || trimmed === actionList.name) {
            closeActionModal();
            return;
        }
        renameList.mutate(
            { id: actionList.id, name: trimmed },
            {
                onSuccess: closeActionModal,
            },
        );
    };

    const handleDeleteList = () => {
        if (!actionList || actionList.role !== "owner") return;
        const listIdToDelete = actionList.id;
        const deletingActive = listIdToDelete === activeList?.id;
        deleteList.mutate(listIdToDelete, {
            onSuccess: () => {
                closeActionModal();
                if (deletingActive) {
                    const fallback = lists.find((list) => list.id !== listIdToDelete)?.id;
                    if (fallback) {
                        setActiveListId(fallback);
                    }
                }
            },
        });
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

        if (selectableLists.length === 0) {
            return (
                <p className="py-2 text-sm text-slate-400">
                    Keine weiteren Listen – nutze unten den Button, um eine neue Liste anzulegen.
                </p>
            );
        }

        return (
            <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
                {selectableLists.map((list) => (
                    <li key={list.id}>
                        <ListPickerItem
                            list={list}
                            onSelect={() => {
                                setActiveListId(list.id);
                                closeListModal();
                            }}
                            onLongPress={() => handleListLongPress(list)}
                        />
                    </li>
                ))}
            </ul>
        );
    };

    const triggerLabel = activeList?.name ?? (isLoadingLists ? "Listen laden…" : "Liste wählen");
    const canRenameActionList = actionList?.role === "owner";
    const trimmedRenameValue = renameValue.trim();
    const renameDisabled =
        !canRenameActionList ||
        !trimmedRenameValue ||
        trimmedRenameValue === actionList?.name ||
        renameList.isPending;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-xl cursor-pointer bg-slate-900/60 px-3 py-2 text-left text-sm font-medium text-slate-100 transition hover:border-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60 sm:w-auto"
                onClick={toggleOpen}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="max-w-56 text-left text-base leading-tight text-slate-100 line-clamp-2 wrap-break-word sm:text-lg">
                    {triggerLabel}
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0" />
            </button>

            <Modal open={isOpen} onClose={closeListModal} title="Weitere Listen">
                <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-900/50 p-2">
                        {renderLists()}
                    </div>
                    <div className="rounded-2xl bg-slate-900/40 p-4">
                        {showCreateForm ? (
                            <form className="space-y-3" onSubmit={handleCreateList}>
                                <input
                                    type="text"
                                    value={newListName}
                                    onChange={(event) => setNewListName(event.target.value)}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-slate-400"
                                    maxLength={MAX_LIST_NAME_LENGTH}
                                    placeholder="Neue Liste"
                                    autoFocus
                                />
                                <div className="text-right text-xs text-slate-500">
                                    {newListName.length}/{MAX_LIST_NAME_LENGTH}
                                </div>
                                <div className="flex items-center justify-end gap-2 text-sm">
                                    <button
                                        type="button"
                                        className="rounded-xl border border-transparent px-3 py-1.5 text-slate-400 transition hover:text-slate-200"
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setNewListName("");
                                        }}
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-300"
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
                                className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl border border-dashed border-slate-700/60 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500"
                                onClick={() => setShowCreateForm(true)}
                            >
                                <Plus className="h-4 w-4" />
                                Neue Liste
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            <Modal open={Boolean(actionList)} onClose={closeActionModal} title="Listen-Aktionen">
                {actionList && (
                    <div className="space-y-4">
                        <div className="flex flex-row gap-2">
                            <input
                                type="text"
                                value={renameValue}
                                onChange={(event) => setRenameValue(event.target.value)}
                                className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-500/40"
                                disabled={!canRenameActionList}
                                maxLength={MAX_LIST_NAME_LENGTH}
                            />
                            <button
                                type="button"
                                aria-label="Änderungen speichern"
                                className="flex h-auto w-12 cursor-pointer items-center cursor-pointer justify-center rounded-xl bg-slate-100 text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-300"
                                onClick={handleRenameSubmit}
                                disabled={renameDisabled}
                            >
                                {renameList.isPending ? (
                                    <span className="text-sm font-semibold">…</span>
                                ) : (
                                    <Save className="h-5 w-5" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                        <p className="flex justify-center text-xs text-slate-500">oder</p>
                        <div className="flex justify-center">
                            <button
                                type="button"
                                className="flex items-center gap-2 cursor-pointer rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-900/50"
                                onClick={handleDeleteList}
                                disabled={!canRenameActionList || deleteList.isPending}
                            >
                                {deleteList.isPending ? (
                                    "Lösche…"
                                ) : (
                                    <>
                                        <Trash2 className="h-4 w-4" />
                                        Liste löschen
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

type ListPickerItemProps = {
    list: ListSummary;
    onSelect: () => void;
    onLongPress: () => void;
};

function ListPickerItem({ list, onSelect, onLongPress }: ListPickerItemProps) {
    const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressTriggeredRef = useRef(false);

    const clearLongPress = (event?: PointerEvent<HTMLButtonElement>) => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
        }
        if (longPressTriggeredRef.current) {
            event?.preventDefault();
            event?.stopPropagation();
            longPressTriggeredRef.current = false;
        }
    };

    const handlePointerDown = () => {
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
        }
        longPressTriggeredRef.current = false;
        pressTimerRef.current = setTimeout(() => {
            longPressTriggeredRef.current = true;
            pressTimerRef.current = null;
            onLongPress();
        }, LONG_PRESS_MS);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (longPressTriggeredRef.current) {
            event.preventDefault();
            event.stopPropagation();
            longPressTriggeredRef.current = false;
            return;
        }
        onSelect();
    };

    return (
        <button
            type="button"
            className="flex w-full items-start cursor-pointer justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800/80"
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerUp={clearLongPress}
            onPointerLeave={() => clearLongPress()}
            onPointerCancel={clearLongPress}
            onContextMenu={(event) => {
                event.preventDefault();
                longPressTriggeredRef.current = true;
                onLongPress();
            }}
        >
            <span className="flex-1 text-left text-sm font-medium leading-tight text-slate-100 line-clamp-2 wrap-break-word">
                {list.name}
            </span>
            {list.role !== "owner" && (
                <span className="text-xs uppercase tracking-wide text-slate-500">{list.role}</span>
            )}
        </button>
    );
}
