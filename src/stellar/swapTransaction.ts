import { HorizonServer } from '@stellar/stellar-sdk/lib/horizon/server';
import { Horizon, Operation, TransactionBuilder } from '@stellar/stellar-sdk';

import { IAsset } from '../types';
import { iAssetToAsset } from '../utils/helpers';

const swapTransaction = async (
  rawFromAmount: string,
  rawToAmount: string,
  lastFieldChanged: 'from' | 'to',
  fromAsset: IAsset,
  toAsset: IAsset,
  path: IAsset[],
  sourceAddress: string,
  server: HorizonServer,
  networkPassphrase: string,
  isChangeTrustNeeded: boolean,
) => {
  const from = Number(Number(rawFromAmount).toFixed(5)).toString();
  const to = Number(((Number(rawToAmount) / 100) * 99.5).toFixed(5)).toString();

  let sourceAccount: null | Horizon.AccountResponse = null;

  try {
    sourceAccount = await server.loadAccount(sourceAddress);
  } catch {}

  if (!sourceAccount) {
    throw new Error('Inactive account cannot send a transaction.');
  }

  let transaction = new TransactionBuilder(sourceAccount, {
    fee: '70000',
    networkPassphrase,
  });

  if (isChangeTrustNeeded) {
    transaction = transaction.addOperation(
      Operation.changeTrust({
        limit: '999999999999',
        asset: iAssetToAsset(toAsset),
      }),
    );
  }

  const newPath = [...path.slice(1, path.length - 1)].map(iAssetToAsset);

  if (lastFieldChanged === 'from') {
    transaction = transaction.addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: iAssetToAsset(fromAsset),
        sendAmount: from,
        destination: sourceAddress,
        destAsset: iAssetToAsset(toAsset),
        destMin: to,
        path: newPath,
      }),
    );
  } else {
    transaction = transaction.addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: iAssetToAsset(fromAsset),
        sendMax: from,
        destination: sourceAddress,
        destAsset: iAssetToAsset(toAsset),
        destAmount: to,
        path: newPath,
      }),
    );
  }

  const transactionEnvelope = transaction.setTimeout(180).build();

  return transactionEnvelope.toXDR();
};

export default swapTransaction;
