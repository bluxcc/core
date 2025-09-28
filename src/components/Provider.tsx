import { useEffect } from "react";
import { Horizon, rpc } from "@stellar/stellar-sdk";

import Modal from "./Modal";
import Header from "./Header";
import { Route } from "../enums";
import { useAppStore } from "../store";
import { getNetworkRpc } from "../utils/helpers";
import { getModalContent } from "../constants/routes";
import useUpdateAccount from "../hooks/useUpdateAccount";

export const Provider = () => {
  useUpdateAccount();

  const store = useAppStore((store) => store);

  const { modal, closeModal, setShowAllWallets } = store;

  const { route } = modal;

  const modalContent = getModalContent("en")[route];

  const shouldShowBackButton =
    (route === Route.WAITING && store.waitingStatus !== "sendTransaction") ||
    (route === Route.ONBOARDING && store.showAllWallets) ||
    route === Route.ACTIVITY ||
    route === Route.SEND ||
    route === Route.OTP ||
    route === Route.BALANCES ||
    route === Route.RECEIVE ||
    route === Route.SWAP ||
    route === Route.BALANCE_DETAILS ||
    route === Route.ABOUT ||
    route === Route.ADD_TOKEN ||
    route === Route.WALLET_CONNECT;

  let modalIcon: "back" | "info" | undefined;

  if (shouldShowBackButton) {
    modalIcon = "back";
  } else if (route === Route.ONBOARDING) {
    modalIcon = "info";
  }

  const handleBackNavigation = () => {
    if (
      route === Route.WAITING ||
      (route === Route.OTP && !store.authState.isAuthenticated) ||
      route === Route.ABOUT ||
      route === Route.WALLET_CONNECT
    ) {
      store.setRoute(Route.ONBOARDING);
    } else if (store.showAllWallets) {
      setShowAllWallets(false);
    } else if (
      route === Route.SEND ||
      route === Route.ACTIVITY ||
      route === Route.BALANCES ||
      route === Route.RECEIVE ||
      route === Route.SWAP
    ) {
      store.setRoute(Route.PROFILE);
    } else if (route === Route.BALANCE_DETAILS || route === Route.ADD_TOKEN) {
      store.setRoute(Route.BALANCES);
    }
  };

  const handleCloseModal = () => {
    closeModal();
    setShowAllWallets(false);

    if (
      store.waitingStatus === "signMessage" ||
      store.waitingStatus === "sendTransaction"
    ) {
      const resolverObject =
        store.waitingStatus === "signMessage"
          ? store.signMessage
          : store.sendTransaction;
      const isFailed =
        modal.route === Route.SIGN_MESSAGE ||
        modal.route === Route.SEND_TRANSACTION ||
        modal.route === Route.FAILED;
      const isSuccessful = modal.route === Route.SUCCESSFUL;

      if (!resolverObject) {
        return;
      }

      const { resolver, rejecter, result } = resolverObject;

      if (isSuccessful) {
        if (resolver && result) {
          // @ts-ignore
          resolver(result);
        }
      } else if (isFailed) {
        if (rejecter) {
          rejecter({ code: 4001, message: "User rejected the transaction" });
        }
      }
    }
  };

  useEffect(() => {
    const { horizon, soroban } = getNetworkRpc(
      store.stellar?.activeNetwork || "",
      store.config.transports ?? {}
    );

    store.setStellar({
      activeNetwork: store.stellar?.activeNetwork || "",
      servers: {
        horizon: new Horizon.Server(horizon),
        soroban: new rpc.Server(soroban),
      },
    });
  }, [
    store.config.transports,
    store.config.networks,
    store.stellar?.activeNetwork,
  ]);

  const showCloseModalIcon =
    route === Route.WRONG_NETWORK ||
    route === Route.WAITING ||
    route === Route.SUCCESSFUL;

  const handleGoToAbout = () => {
    store.setRoute(Route.ABOUT);
  };

  return (
    <Modal
      isOpen={modal.isOpen}
      isSticky={modalContent.isSticky}
      onClose={handleCloseModal}
      appearance={store.config.appearance}
    >
      <Header
        onBack={handleBackNavigation}
        onInfo={handleGoToAbout}
        onClose={modalContent.isSticky ? () => {} : handleCloseModal}
        title={
          store.modal.dynamicTitle !== ""
            ? store.modal.dynamicTitle
            : modalContent.title
        }
        icon={modalIcon}
        closeButton={!showCloseModalIcon}
      />
      {modalContent.Component}
    </Modal>
  );
};
