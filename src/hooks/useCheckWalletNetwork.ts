import { useEffect, useState } from 'react';

import { IStore } from '../store';
import { walletsConfig } from '../wallets';
import { Route, SupportedWallet } from '../enums';
import { getWalletNetwork } from '../utils/helpers';
import { internalSwitchNetwork } from '../exports/utils';

const useCheckWalletNetwork = (store: IStore) => {
  const [shouldModalOpen, setShouldModalOpen] = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      if (!store.authState.isAuthenticated || !store.user?.authValue) {
        setShouldModalOpen(false);

        return;
      }

      if (store.user.authMethod !== 'wallet') {
        setShouldModalOpen(false);

        return;
      }

      getWalletNetwork(walletsConfig[store.user.authValue as SupportedWallet])
        .then((networkPassphrase) => {
          if (
            networkPassphrase &&
            store.config.networks.includes(networkPassphrase) &&
            store.stellar?.activeNetwork !== networkPassphrase &&
            !store.networkSyncDisabled
          ) {
            internalSwitchNetwork(networkPassphrase);
          } else if (
            networkPassphrase &&
            !store.config.networks.includes(networkPassphrase)
          ) {
            setShouldModalOpen(true);
          } else {
            setShouldModalOpen(false);
          }
        })
        .catch(() => {
          setShouldModalOpen(false);
        });
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
        if (shouldModalOpen && store.config.promptOnWrongNetwork) {
          store.openModal(Route.WRONG_NETWORK);
        } else {
          store.closeModal();
        }
      }, 300);
    } else {
      if (!shouldModalOpen && store.modal.route === Route.WRONG_NETWORK) {
        store.closeModal();
      }
    }
  }, [shouldModalOpen, store.modal.isOpen]);
};

export default useCheckWalletNetwork;
