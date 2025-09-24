import { IWallet } from "../types";

const handleSignMessage = async (
  wallet: IWallet,
  message: string,
  address: string,
  network: string,
) => {
  if (!wallet?.signMessage) {
    throw new Error("Wallet does not support signMessage.");
  }

  const signedMessage = await wallet.signMessage(message, {
    address,
    networkPassphrase: network,
  });

  return signedMessage;
};

export default handleSignMessage;
