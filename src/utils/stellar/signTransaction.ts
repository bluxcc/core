import { IWallet } from "../../types";

const signTransaction = async (
  wallet: IWallet,
  xdr: string,
  address: string,
  network: string
) => {
  if (!wallet?.signTransaction) {
    throw new Error("Wallet does not support transaction signing.");
  }

  const signedXdr = await wallet.signTransaction(xdr, {
    networkPassphrase: network,
    address,
  });

  return signedXdr;
};

export default signTransaction;
