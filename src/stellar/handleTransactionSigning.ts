import { ITransports, IWallet } from '../types';
import signTransaction from './signTransaction';
import submitTransaction from './submitTransaction';

const handleTransactionSigning = async (
  wallet: IWallet,
  xdr: string,
  userAddress: string,
  network: string,
  transports: ITransports,
  shouldSubmit: boolean,
) => {
  const signedXdr = await signTransaction(wallet, xdr, userAddress, network);

  if (shouldSubmit) {
    const result = await submitTransaction(
      signedXdr,
      network,
      transports || {},
    );

    return result;
  }

  return signedXdr;
};

export default handleTransactionSigning;
