import Modal from "./Modal";
import Header from "./Header";
import { Route } from "../enums";
import { useAppStore } from "../store";
import { getModalContent } from "../constants/routes";

export const Provider = () => {
  const store = useAppStore((store) => store);

  const { modal, closeModal } = store;

  const { route } = modal;

  const modalContent = getModalContent("en")[route];

  const shouldShowBackButton =
    (route === Route.WAITING && store.waitingStatus !== "sendTransaction") ||
    // todo
    route === Route.ONBOARDING || // (route === Routes.ONBOARDING && value.showAllWallets) ||
    route === Route.ACTIVITY ||
    route === Route.SEND ||
    route === Route.OTP ||
    route === Route.BALANCES ||
    route === Route.RECEIVE ||
    route === Route.SWAP;

  let modalIcon: "back" | "info" | undefined;

  if (shouldShowBackButton) {
    modalIcon = "back";
  } else if (route === Route.ONBOARDING) {
    modalIcon = "info";
  }

  const handleBackNavigation = () => {
    if (
      route === Route.WAITING ||
      (route === Route.OTP && !store.authState.isAuthenticated)
    ) {
      store.setRoute(Route.ONBOARDING);
      // } else if (value.showAllWallets) {
      // setValue((prev) => ({ ...prev, showAllWallets: false }));
    } else if (
      route === Route.SEND ||
      route === Route.ACTIVITY ||
      route === Route.BALANCES ||
      route === Route.RECEIVE ||
      route === Route.SWAP
    ) {
      store.setRoute(Route.PROFILE);
    }
  };

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

  const showCloseModalIcon =
    route === Route.WRONG_NETWORK ||
    route === Route.WAITING ||
    route === Route.SUCCESSFUL;

  return (
    <Modal
      isOpen={modal.isOpen}
      isSticky={modalContent.isSticky}
      onClose={handleCloseModal}
    >
      <Header
        onBack={handleBackNavigation}
        onClose={modalContent.isSticky ? () => { } : handleCloseModal}
        title={modalContent.title}
        icon={modalIcon}
        closeButton={!showCloseModalIcon}
      />
      {modalContent.Component}
    </Modal>
  );
};
