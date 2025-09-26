import Core from '@walletconnect/core';
import SignClient from '@walletconnect/sign-client';

import { getState } from '../store';
import { IWalletConnectMetaData } from '../types';

let isInitialized = false;

const initializeWalletConnect = async (
  wc: IWalletConnectMetaData,
  appName: string,
) => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;

  try {
    const state = getState();

    const core = new Core({
      projectId: 'ebdf266b394a51841e471539ccbdefaa',
    });

    const client = await SignClient.init({
      core,
      metadata: {
        name: appName,
        url: wc.url,
        icons: wc.icons,
        description: wc.description,
      },
    });

    const connection = await client.connect({
      requiredNamespaces: {
        eip155: {
          chains: ['eip155:1'], // e.g., Ethereum Mainnet
          methods: ['eth_sendTransaction', 'personal_sign'],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
    });

    state.setWalletConnectClient(client, connection);
  } catch { }
};

export default initializeWalletConnect;
