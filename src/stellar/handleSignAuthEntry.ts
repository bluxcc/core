import { IWallet } from '../types';

const handleSignAuthEntry = async (
  wallet: IWallet,
  authEntry: string,
  address: string,
  network: string,
) => {
  if (!wallet?.signAuthEntry) {
    throw new Error('Wallet does not support signAuthEntry.');
  }

  const signedAuthEntry = await wallet.signAuthEntry(authEntry, {
    address,
    network,
  });

  return signedAuthEntry;
};

export default handleSignAuthEntry;
