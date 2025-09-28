import Core from '@walletconnect/core';
import SignClient from '@walletconnect/sign-client';

import { getState } from '../store';
import { IWalletConnectMetaData } from '../types';
import { WC_STELLAR_PUBNET, WC_STELLAR_TESTNET } from '../constants/consts';

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
        stellar: {
          methods: [
            'stellar_signXDR',
            'stellar_signAndSubmitXDR',
            'stellar_signMessage',
          ],
          chains: [WC_STELLAR_PUBNET, WC_STELLAR_TESTNET],
          events: [],
        },
      },
    });

    state.setWalletConnectClient(client, connection);
  } catch { }
};

export default initializeWalletConnect;
