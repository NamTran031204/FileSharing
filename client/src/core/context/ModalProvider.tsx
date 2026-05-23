import { useState, type ReactNode } from 'react';
import { ModalContext, type ModalConfig } from './ModalContext';
import ModalItem from './ModalItem';

interface ModalInternal extends ModalConfig {
  key: string;
  resolve?: (v: unknown) => void;
  reject?: (e?: unknown) => void;
}

interface ModalProviderProps {
  children: ReactNode;
}

const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modals, setModals] = useState<ModalInternal[]>([]);

  const showModal = (config: ModalConfig) => {
    const key = `modal_${Date.now()}_${Math.random()}`;
    const promise = new Promise<unknown>((resolve, reject) => {
      const modal: ModalInternal = {
        ...config,
        key,
        open: true,
        resolve,
        reject,
      };
      setModals((prev) => [...prev, modal]);
    });
    return { key, promise };
  };

  const closeModal = (key: string) => {
    setModals((prev) =>
      prev.map((m) => (m.key === key ? { ...m, open: false } : m)),
    );
  };

  return (
    <ModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      {modals.map((modal, index) => (
        <ModalItem key={modal.key} modal={modal} index={index} closeModal={closeModal} />
      ))}
    </ModalContext.Provider>
  );
};

export default ModalProvider;
