import Modal from "./Modal";
import { useAppStore } from "../store";
import { getModalContent } from "../constants/routes";

export const Provider = () => {
  const store = useAppStore((store) => store);

  const { modal, closeModal } = store;

  const modalContent = getModalContent("en")[modal.route];

  const handleCloseModal = () => {
    closeModal();

    // const { resolver, rejecter, result } = value.signTransaction;
    //
    // if (modal.route === Route.SUCCESSFUL && waitingStatus === "signing") {
    //   if (resolver && result) {
    //     resolver(result);
    //   }
    // } else if (modal.route === Route.SIGN_TRANSACTION) {
    //   if (rejecter) {
    //     rejecter({ code: 4001, message: "User rejected the transaction" });
    //   }
    // }
  };

  return (
    <Modal isOpen={modal.isOpen} onClose={handleCloseModal}>
      {modalContent.Component}
    </Modal>
  );
};
