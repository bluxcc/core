import { IUser } from '../store';
import { ITransports } from '../types';
import { walletsConfig } from '../wallets';
import signTransaction from './signTransaction';
import submitTransaction from './submitTransaction';

const handleTransactionSigning = async (
  xdr: string,
  user: IUser,
  network: string,
  transports: ITransports,
) => {
  console.log(user.authMethod, user.authValue);

  if (user.authMethod === 'wallet') {
    // todo
    // @ts-ignore
    const wallet = walletsConfig[user.authValue];

    console.log(wallet);

    const signedXdr = await signTransaction(wallet, xdr, user.address, network);

    const result = await submitTransaction(
      signedXdr,
      network,
      transports || {},
    );

    return result;
  }
};

export default handleTransactionSigning;
