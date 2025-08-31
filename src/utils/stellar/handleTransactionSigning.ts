import {
  ISendTransactionOptionsInternal,
  ITransports,
  IWallet,
} from "../../types";
import signTransaction from "./signTransaction";
import submitTransaction from "./submitTransaction";

const handleTransactionSigning = async (
  wallet: IWallet,
  xdr: string,
  userAddress: string,
  options: ISendTransactionOptionsInternal,
  transports: ITransports
) => {
  const signedXdr = await signTransaction(
    wallet,
    xdr,
    userAddress,
    options.network
  );

  const result = await submitTransaction(signedXdr, options, transports || {});

  return result;
};

export default handleTransactionSigning;
