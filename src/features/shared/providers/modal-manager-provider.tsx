"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CompletedTodosPage } from "@/features/todos/components/completed-todos-page";
import { ProfileModal } from "@/features/auth/components/profile-modal";
import { UpdateToast } from "@/components/update-toast";

type ModalKey = "profile" | "completedTodos" | null;

type ModalManagerContextValue = {
  activeModal: ModalKey;
  openModal: (key: Exclude<ModalKey, null>) => void;
  closeModal: () => void;
};

const ModalManagerContext = createContext<ModalManagerContextValue | undefined>(undefined);

export const ModalManagerProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeModal, setActiveModal] = useState<ModalKey>(null);

  const openModal = useCallback((key: Exclude<ModalKey, null>) => {
    setActiveModal(key);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const value = useMemo(
    () => ({ activeModal, openModal, closeModal }),
    [activeModal, openModal, closeModal]
  );

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
      {activeModal === "completedTodos" ? (
        <CompletedTodosPage onClose={closeModal} />
      ) : null}
      <ProfileModal open={activeModal === "profile"} onClose={closeModal} />
      <UpdateToast />
    </ModalManagerContext.Provider>
  );
};

export const useModalManager = () => {
  const context = useContext(ModalManagerContext);
  if (!context) {
    throw new Error("useModalManager must be used within a ModalManagerProvider");
  }
  return context;
};
