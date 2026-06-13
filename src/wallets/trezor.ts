import TrezorConnect from '@trezor/connect-web';
import { Networks, Transaction } from '@stellar/stellar-sdk';

import { IWallet } from '../types';
import { getState } from '../store';
import { SupportedWallet } from '../enums';
import { waitForTrezor } from '../utils/initializeTrezor';

const TREZOR_PATH = "m/44'/148'/0'";

const getTrezorAddress = async (): Promise<string> => {
  const result = await TrezorConnect.stellarGetAddress({
    path: TREZOR_PATH,
    showOnTrezor: false,
  });

  if (!result.success) {
    throw new Error(`BLUX: ${result.payload.error}`);
  }

  return result.payload.address;
};

export const trezorConfig: IWallet = {
  name: SupportedWallet.Trezor,
  website: 'https://trezor.io',

  connect: async () => {
    try {
      await waitForTrezor();

      const address = await getTrezorAddress();

      return address;
    } catch {
      throw new Error('BLUX: Failed to connect to Trezor.');
    }
  },
  disconnect: async () => { },

  getNetwork: async () => {
    throw new Error('BLUX: Trezor does not support the getNetwork function');
  },

  isAvailable: async () => {
    const { config } = getState();

    return typeof window !== 'undefined' && !!config.trezor;
  },

  signAuthEntry: async () => {
    throw new Error('BLUX: Trezor does not support the signAuthEntry function');
  },

  signMessage: async () => {
    throw new Error('BLUX: Trezor does not support the signMessage function');
  },

  signTransaction: async (xdrStr: string, options): Promise<string> => {
    try {
      await waitForTrezor();

      const account = await getTrezorAddress();

      const tx = new Transaction(xdrStr, options.network);

      const result = await TrezorConnect.stellarSignTransaction({
        // TODO: the trezor package needs updating, move from the alpha version to an stable
        // version, also, the documentation in github says that this is the way to use the new
        // stable version: xdrBase64: tx.toXDR(). Needs testing.
        transaction: tx,
        path: TREZOR_PATH,
        networkPassphrase: options.network,
      });

      if (!result.success) {
        throw new Error(`BLUX: ${result.payload.error}`);
      }

      tx.addSignature(
        account,
        Buffer.from(result.payload.signature, 'hex').toString('base64'),
      );

      return tx.toXDR();
    } catch {
      throw new Error('BLUX: Failed to sign the transaction with Trezor.');
    }
  },
};
