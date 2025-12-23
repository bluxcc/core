import { ITransports, IWallet } from '../types';
import signTransaction from './signTransaction';
import submitTransaction from './submitTransaction';

const handleTransactionSigning = async (
  wallet: IWallet,
  xdr: string,
  userAddress: string,
  network: string,
  transports: ITransports,
) => {
  const signedXdr = await signTransaction(wallet, xdr, userAddress, network);

  const result = await submitTransaction(signedXdr, network, transports || {});

  return result;
};

export default handleTransactionSigning;
