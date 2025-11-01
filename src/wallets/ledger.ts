import * as Str from '@ledgerhq/hw-app-str';
import * as TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { Keypair, StrKey, Transaction, xdr } from '@stellar/stellar-sdk';

import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const ledgerConfig: IWallet = {
  name: SupportedWallet.Ledger,
  website: 'https://www.ledger.com',

  isAvailable: async () => {
    const result = await TransportWebUSB.default.isSupported();

    console.log(result);

    return result;
  },

  connect: async () => {
    try {
      const transport = await TransportWebUSB.default.create();
      const app = new Str.default(transport);
      const { rawPublicKey } = await app.getPublicKey("44'/148'/0'");
      const publicKey = StrKey.encodeEd25519PublicKey(rawPublicKey);
      return publicKey;
    } catch (error) {
      console.error('Error connecting to Ledger:', error);
      throw new Error('Failed to connect to Ledger.');
    }
  },
  disconnect: async () => { },
  signTransaction: async (xdrStr: string, options): Promise<string> => {
    try {
      const tx = new Transaction(xdrStr, options.network);
      const transport = await TransportWebUSB.default.create();
      const app = new Str.default(transport);
      const { signature } = await app.signTransaction(
        "44'/148'/0'",
        tx.signatureBase(),
      );
      const keyPair = Keypair.fromPublicKey(options.address);
      const hint = keyPair.signatureHint();
      const decorated = new xdr.DecoratedSignature({
        hint,
        signature,
      });
      tx.signatures.push(decorated);
      return tx.toXDR();
    } catch (error) {
      console.error('Error signing transaction with Ledger:', error);

      throw new Error('Failed to sign the transaction with Ledger.');
    }
  },
  getNetwork: async () => {
    throw new Error('Failed to get network from ledger');
  },
  signAuthEntry: async () => {
    throw new Error('ledger does not support the signAuthEntry function');
  },
  signMessage: async () => {
    throw new Error('ledger does not support the signMessage function');
  },
};
