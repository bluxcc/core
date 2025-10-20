import { useEffect } from 'react';
import { Horizon, rpc } from '@stellar/stellar-sdk';

import Modal from './Modal';
import Header from './Header';
import { Route } from '../enums';
import { useAppStore } from '../store';
import { getModalContent } from '../constants/routes';
import useUpdateAccount from '../hooks/useUpdateAccount';
import useCheckWalletNetwork from '../hooks/useCheckWalletNetwork';
import {
  getNetworkRpc,
  decideBackRouteFromSelectAsset,
} from '../utils/helpers';

export const Provider = () => {
  useUpdateAccount();

  const store = useAppStore((store) => store);

  useCheckWalletNetwork(store);

  const { modal, closeModal, setShowAllWallets } = store;

  const { route } = modal;

  const modalContent = getModalContent()[route];

  const isSticky = route === Route.WRONG_NETWORK;
  const isWaiting = route === Route.WAITING;
  const isSuccessful = route === Route.SUCCESSFUL;
  const isFailed =
    route === Route.SIGN_MESSAGE ||
    route === Route.SEND_TRANSACTION ||
    route === Route.FAILED;

  const showCloseIcon =
    route === Route.WRONG_NETWORK || isWaiting || isSuccessful;

  const shouldShowBackButton =
    (isWaiting && store.waitingStatus !== 'sendTransaction') ||
    (route === Route.ONBOARDING && store.showAllWallets) ||
    [
      Route.ACTIVITY,
      Route.SEND,
      Route.OTP,
      Route.BALANCES,
      Route.RECEIVE,
      Route.SWAP,
      Route.BALANCE_DETAILS,
      Route.ABOUT,
      Route.ADD_TOKEN,
      Route.WALLET_CONNECT,
    ].includes(route);

  const modalIcon = shouldShowBackButton
    ? 'back'
    : route === Route.ONBOARDING
      ? 'info'
      : undefined;

  const modalHeaderTitle = store.modal.dynamicTitle || modalContent.title;

  const handleInfo = () => {
    store.setRoute(Route.ABOUT);
  };

  const handleBack = () => {
    if (
      route === Route.WAITING ||
      (route === Route.OTP && !store.authState.isAuthenticated) ||
      route === Route.ABOUT ||
      route === Route.WALLET_CONNECT
    ) {
      store.setRoute(Route.ONBOARDING);
      return;
    }

    if (store.showAllWallets) {
      setShowAllWallets(false);
      return;
    }

    if (
      [
        Route.SEND,
        Route.ACTIVITY,
        Route.BALANCES,
        Route.RECEIVE,
        Route.SWAP,
      ].includes(route)
    ) {
      store.setRoute(Route.PROFILE);
      return;
    }

    if ([Route.BALANCE_DETAILS, Route.ADD_TOKEN].includes(route)) {
      store.setRoute(Route.BALANCES);
      return;
    }

    if (route === Route.SELECT_ASSET) {
      const prevRoute = decideBackRouteFromSelectAsset(store.selectAsset.field);
      store.setRoute(prevRoute);
    }
  };

  const handleClose = () => {
    if (isSticky) return;

    closeModal();
    setShowAllWallets(false);

    const { waitingStatus } = store;
    const isSigning = waitingStatus === 'signMessage';
    const isSending = waitingStatus === 'sendTransaction';
    if (!isSigning && !isSending) return;

    const resolverObject = isSigning
      ? store.signMessage
      : store.sendTransaction;
    if (!resolverObject) return;

    const { resolver, rejecter, result } = resolverObject;

    if (isSuccessful && resolver && result) {
      // @ts-ignore
      resolver(result);

      setTimeout(() => {
        store.cleanUp(waitingStatus);
      }, 200);
    } else if (isFailed && rejecter) {
      rejecter('User rejected the transaction');

      setTimeout(() => {
        store.cleanUp(waitingStatus);
      }, 200);
    }
  };

  useEffect(() => {
    if (!store.authState.isAuthenticated) {
      if (store.signMessage) {
        store.cleanUp('signMessage');

        store.signMessage.rejecter('User logged out during the process.');
      }

      if (store.sendTransaction) {
        store.cleanUp('sendTransaction');

        store.sendTransaction.rejecter('User logged out during the process.');
      }
    }
  }, [store.authState]);

  useEffect(() => {
    const { horizon, soroban } = getNetworkRpc(
      store.stellar?.activeNetwork || '',
      store.config.transports ?? {},
    );

    store.setStellar({
      activeNetwork: store.stellar?.activeNetwork || '',
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

  return (
    <Modal
      isOpen={modal.isOpen}
      isSticky={isSticky || store.config.isPersistent}
      onClose={handleClose}
      isPersistent={store.config.isPersistent ?? false}
      appearance={store.config.appearance}
    >
      <Header
        icon={modalIcon}
        onBack={handleBack}
        onInfo={handleInfo}
        onClose={handleClose}
        title={modalHeaderTitle}
        closeButton={!showCloseIcon}
        isPersistent={store.config.isPersistent ?? false}
      />
      {modalContent.Component}
    </Modal>
  );
};
