import { useEffect, useState } from 'react';

import { IStore } from '../store';
import { walletsConfig } from '../wallets';
import { Route, SupportedWallet } from '../enums';
import { getWalletNetwork } from '../utils/helpers';
import switchNetwork from '../exports/core/switchNetwork';

const useCheckWalletNetwork = (store: IStore) => {
  const [shouldModalOpen, setShouldModalOpen] = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      if (!store.authState.isAuthenticated || !store.user?.authValue) {
        return;
      }

      if (store.user.authMethod !== 'wallet') {
        return;
      }

      getWalletNetwork(walletsConfig[store.user.authValue as SupportedWallet])
        .then((networkPassphrase) => {
          if (
            networkPassphrase &&
            store.config.networks.includes(networkPassphrase) &&
            store.stellar?.activeNetwork !== networkPassphrase
          ) {
            switchNetwork(networkPassphrase);
          } else if (
            networkPassphrase &&
            !store.config.networks.includes(networkPassphrase)
          ) {
            setShouldModalOpen(true);
          } else {
            setShouldModalOpen(false);
          }
        })
        .catch(() => {});
    }, 1000);

    return () => {
      clearInterval(i);

      setShouldModalOpen(false);
    };
  }, [
    store.authState.isAuthenticated,
    store.config.networks,
    store.user?.authValue,
    store.stellar?.activeNetwork,
  ]);

  useEffect(() => {
    if (!store.modal.isOpen) {
      setTimeout(() => {
        if (shouldModalOpen) {
          store.openModal(Route.WRONG_NETWORK);
        } else {
          store.closeModal();
        }
      }, 300);
    }
  }, [shouldModalOpen, store.modal.isOpen]);
};

export default useCheckWalletNetwork;
