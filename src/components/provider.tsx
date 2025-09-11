import Modal from "./Modal";
import { useAppStore } from "../store";
import { getModalContent } from "../constants/routes";

export const Provider = () => {
  const modal = useAppStore((store) => store.modal);

  const modalContent = getModalContent("en")[modal.route];

  return <Modal isOpen={modal.isOpen}>{modalContent.Component}</Modal>;
};
