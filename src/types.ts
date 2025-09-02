export interface ModalState {
  isOpen: boolean;
  title: string;
  content: string;
}

export interface ModalActions {
  openModal?: (title?: string, content?: string) => void;
  closeModal: () => void;
}

export interface AppState {
  modal: ModalState;
  route: string;
  value: number;
}

export interface AppActions {
  setRoute: (route: string) => void;
  setValue: (value: number) => void;
  openModal: (title?: string, content?: string) => void;
  closeModal: () => void;
}
