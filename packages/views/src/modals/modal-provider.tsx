import React, { createContext, useContext, useState, useCallback } from "react";

export interface ModalDefinition {
  id: string;
  component: React.FC<{ onClose: () => void }>;
}

interface ModalContextValue {
  openModal: (id: string) => void;
  closeModal: (id: string) => void;
  closeAll: () => void;
  isOpen: (id: string) => boolean;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalProviderProps {
  modals: ModalDefinition[];
  children: React.ReactNode;
}

export function ModalProvider({ modals, children }: ModalProviderProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const openModal = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const closeModal = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenIds(new Set());
  }, []);

  const isOpen = useCallback(
    (id: string) => openIds.has(id),
    [openIds],
  );

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeAll, isOpen }}>
      {children}
      <ModalContainer modals={modals} openIds={openIds} onClose={closeModal} />
    </ModalContext.Provider>
  );
}

function ModalContainer({
  modals,
  openIds,
  onClose,
}: {
  modals: ModalDefinition[];
  openIds: Set<string>;
  onClose: (id: string) => void;
}) {
  return (
    <>
      {modals.map((modal) => {
        if (!openIds.has(modal.id)) return null;
        const Component = modal.component;
        return <Component key={modal.id} onClose={() => onClose(modal.id)} />;
      })}
    </>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return ctx;
}
