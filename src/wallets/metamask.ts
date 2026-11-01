import { MetaMaskStellarAdapter } from '@metamask/connect-stellar';
import { StrKey } from '@stellar/stellar-sdk';

import { IWallet } from '../types';
import { StellarNetwork, SupportedWallet } from '../enums';

let adapter: MetaMaskStellarAdapter | undefined;

const getAdapter = () => {
  if (typeof window === 'undefined') {
    throw new Error('BLUX: MetaMask requires a browser.');
  }

  return (adapter ??= new MetaMaskStellarAdapter());
};

const throwIfError = (error?: { message: string; code?: number }) => {
  if (error) {
    throw Object.assign(
      new Error(error.message || 'BLUX: MetaMask request failed.'),
      error,
    );
  }
};

const getAddress = async (): Promise<string> => {
  const { address, error } = await getAdapter().requestAccess();
  throwIfError(error);

  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error('BLUX: MetaMask Stellar account unavailable.');
  }

  return address;
};

const requireMainnet = (network: string) => {
  if (network !== StellarNetwork.PUBLIC) {
    throw new Error('BLUX: MetaMask only supports Mainnet.');
  }
};

const getSigningOptions = async (address: string) => {
  if ((await getAddress()) !== address) {
    throw new Error('BLUX: The selected MetaMask account has changed.');
  }

  return { address, networkPassphrase: StellarNetwork.PUBLIC };
};

type SignResult = {
  signedTxXdr?: string;
  signedMessage?: string;
  signedAuthEntry?: string | null;
  signerAddress?: string;
  error?: { message: string; code?: number };
};

const getSignature = (
  result: SignResult,
  address: string,
  resultKey: 'signedTxXdr' | 'signedMessage' | 'signedAuthEntry',
): string => {
  throwIfError(result?.error);
  if (result?.signerAddress && result.signerAddress !== address) {
    throw new Error('BLUX: MetaMask returned a different signer.');
  }

  const signed = result?.[resultKey];
  if (typeof signed !== 'string' || !signed.trim()) {
    throw new Error(`BLUX: MetaMask did not return ${resultKey}.`);
  }

  return signed;
};

export const metamaskConfig: IWallet = {
  name: SupportedWallet.MetaMask,
  website: 'https://metamask.io',
  authenticateWithSignedMessage: true,
  connect: getAddress,
  disconnect: async () => {
    if (adapter) throwIfError((await adapter.disconnect()).error);
  },
  getNetwork: async () => {
    const { network, networkPassphrase, error } =
      await getAdapter().getNetwork();
    throwIfError(error);
    return { network, passphrase: networkPassphrase };
  },
  isAvailable: async () => {
    if (typeof window === 'undefined') return false;
    try {
      return await MetaMaskStellarAdapter.isMetaMaskAvailable();
    } catch {
      return false;
    }
  },
  signAuthEntry: async (authEntry, options) => {
    requireMainnet(options.network);
    const opts = await getSigningOptions(options.address);
    const result = await getAdapter().signAuthEntry(authEntry, opts);
    return getSignature(result, options.address, 'signedAuthEntry');
  },
  // SEP-53 messages are network-independent. Login challenges can carry the API's
  // Testnet default while MetaMask signs the same message through its Mainnet scope.
  signMessage: async (message, options) => {
    const opts = await getSigningOptions(options.address);
    const result = await getAdapter().signMessage(message, opts);
    return getSignature(result, options.address, 'signedMessage');
  },
  signTransaction: async (xdr, options) => {
    requireMainnet(options.network);
    const opts = await getSigningOptions(options.address);
    const result = await getAdapter().signTransaction(xdr, opts);
    return getSignature(result, options.address, 'signedTxXdr');
  },
};
