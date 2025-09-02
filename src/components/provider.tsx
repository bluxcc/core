import { createContext, useEffect, useState } from "react";

import Modal from "./Modal";
import { BLUX_EVENT_NAME } from "../constants/consts";

interface ModalState {
  isOpen: boolean;
  title: string;
  content: string;
}

interface AppState {
  modal: ModalState;
}

interface AppActions {
  openModal: (title?: string, content?: string) => void;
  closeModal: () => void;
}

interface ProviderContextType extends AppState, AppActions {}

const ProviderContext = createContext<ProviderContextType | undefined>(
  undefined,
);

export const Provider = () => {
  const [state, setState] = useState<AppState>({
    modal: {
      isOpen: false,
      title: "",
      content: "",
    },
  });

  const openModal = (title?: string, content?: string) => {
    setState((prev) => ({
      ...prev,
      modal: {
        isOpen: true,
        title: title || "Default Title",
        content: content || "Default content",
      },
    }));
  };

  const closeModal = () => {
    setState((prev) => ({
      ...prev,
      modal: { ...prev.modal, isOpen: false },
    }));
  };

  useEffect(() => {
    const handleModalOpen = (e: CustomEvent) => {
      const { title, content } = e.detail;
      openModal(title, content);
    };

    window.addEventListener(BLUX_EVENT_NAME, handleModalOpen as EventListener);

    return () => {
      window.removeEventListener(
        BLUX_EVENT_NAME,
        handleModalOpen as EventListener,
      );
    };
  }, []);

  return (
    <ProviderContext.Provider value={{ ...state, openModal, closeModal }}>
      <Modal
        isOpen={state.modal.isOpen}
        title={state.modal.title}
        content={state.modal.content}
        closeModal={closeModal}
      />
    </ProviderContext.Provider>
  );
};
