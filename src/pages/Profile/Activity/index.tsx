import { useEffect, useState } from 'react';
import { Horizon } from '@stellar/stellar-sdk';

import { useAppStore } from '../../../store';
import Button from '../../../components/Button';
import { useLang } from '../../../hooks/useLang';
import useTransactions from '../../../hooks/useTransactions';
import History, { TxDetail } from '../../../components/Transaction/History';
import {
  hexToRgba,
  toTitleFormat,
  getExplorerUrl,
  humanizeAmount,
} from '../../../utils/helpers';

const handleAssetText = (
  op: Horizon.ServerApi.PaymentOperationRecord | any,
  poolLabel: string,
) => {
  if (op.asset_type === 'native') {
    return 'XLM';
  }
  return op.asset_code || poolLabel;
};

const PAYMENT_TYPES = new Set(['payment']);
const PATH_PAYMENT_TYPES = new Set([
  'path_payment_strict_send',
  'path_payment_strict_receive',
  Horizon.HorizonApi.OperationResponseType.pathPaymentStrictSend,
  Horizon.HorizonApi.OperationResponseType.pathPayment,
]);
const CREATE_ACCOUNT_TYPES = new Set(['create_account', 'createAccount']);
const INVOKE_TYPES = new Set(['invoke_host_function', 'invokeHostFunction']);

type AssetBalanceChange = {
  type?: string;
  from?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
};

const sameAddress = (a?: string, b?: string) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

const pickPrimaryOp = (ops: Horizon.ServerApi.OperationRecord[]) =>
  ops.find((op) => PAYMENT_TYPES.has(op.type)) ||
  ops.find((op) => PATH_PAYMENT_TYPES.has(op.type)) ||
  ops.find((op) => CREATE_ACCOUNT_TYPES.has(op.type)) ||
  ops.find((op) => INVOKE_TYPES.has(op.type)) ||
  ops[0];

const Activity = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const { loading, transactions } = useTransactions();
  const [transactionsDetails, setTransactionsDetails] = useState<TxDetail[]>(
    [],
  );
  const appearance = store.config.appearance;
  const userAddress = store.user?.address as string;
  const explorerUrl = getExplorerUrl(
    store.stellar?.activeNetwork as string,
    store.config.explorer,
    'accountUrl',
    userAddress,
  );

  const handleGoToExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (!transactions) {
      setTransactionsDetails([]);
      return;
    }

    const result: TxDetail[] = [];

    for (const tx of transactions) {
      const ops = tx.operations || [];
      const op = pickPrimaryOp(ops);

      if (!op?.type) {
        continue;
      }

      const details: TxDetail = {
        hash: tx.hash,
        description: '',
        date: tx.created_at,
        action: 'other',
        title: toTitleFormat(op.type),
      };

      const isPrimaryAction =
        PAYMENT_TYPES.has(op.type) ||
        PATH_PAYMENT_TYPES.has(op.type) ||
        CREATE_ACCOUNT_TYPES.has(op.type) ||
        INVOKE_TYPES.has(op.type);

      if (ops.length > 1 && !isPrimaryAction) {
        details.title = t('multiOperation');
        details.action = 'multi';
      } else if (PAYMENT_TYPES.has(op.type)) {
        const payment = op as Horizon.ServerApi.PaymentOperationRecord;
        const incoming = sameAddress(payment.to, userAddress);

        details.action = incoming ? 'receive' : 'send';
        details.title = incoming ? t('receive') : t('send');
        details.description = `${humanizeAmount(payment.amount)} ${handleAssetText(
          payment,
          t('pool'),
        )}`;
      } else if (PATH_PAYMENT_TYPES.has(op.type)) {
        details.title = t('swap');
        details.action = 'swap';
        details.description = t('receivedAsset', {
          asset: handleAssetText(op, t('pool')),
        });
      } else if (CREATE_ACCOUNT_TYPES.has(op.type)) {
        const created = op as Horizon.ServerApi.CreateAccountOperationRecord;
        const incoming = sameAddress(created.account, userAddress);

        details.action = incoming ? 'receive' : 'send';
        details.title = incoming ? t('receive') : t('send');
        details.description = `${humanizeAmount(created.starting_balance)} XLM`;
      } else if (INVOKE_TYPES.has(op.type)) {
        const changes: AssetBalanceChange[] = Array.isArray(
          (op as { asset_balance_changes?: AssetBalanceChange[] })
            .asset_balance_changes,
        )
          ? (op as { asset_balance_changes: AssetBalanceChange[] })
              .asset_balance_changes
          : [];

        const transfer = changes.find(
          (change) =>
            change.type === 'transfer' &&
            (sameAddress(change.to, userAddress) ||
              sameAddress(change.from, userAddress)),
        );

        if (transfer?.amount) {
          const incoming = sameAddress(transfer.to, userAddress);

          details.action = incoming ? 'receive' : 'send';
          details.title = incoming ? t('receive') : t('send');
          details.description = `${humanizeAmount(transfer.amount)} ${
            transfer.asset_type === 'native'
              ? 'XLM'
              : transfer.asset_code || t('pool')
          }`;
        }
      }

      result.push(details);
    }

    setTransactionsDetails(result);
  }, [transactions, userAddress]);

  const isEmpty = !loading && transactionsDetails.length === 0;

  return (
    <div className="bluxcc:flex bluxcc:h-[355px] bluxcc:flex-col">
      {loading ? (
        <div
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          className="bluxcc:flex bluxcc:h-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:text-center"
        >
          {t('loadingActivity')}
        </div>
      ) : isEmpty ? (
        <div
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          className="bluxcc:flex bluxcc:h-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:text-center"
        >
          {t('noActivityFound')}
        </div>
      ) : (
        transactionsDetails.map((tx, index) => (
          <div
            key={tx.hash || index}
            style={{
              borderBottomStyle: 'dashed',
              borderBottomWidth:
                index < transactionsDetails.length - 1
                  ? appearance.borderWidth
                  : '0px',
              borderBottomColor: appearance.borderColor,
            }}
            className={`bluxcc:p-2`}
          >
            <History tx={tx} />
          </div>
        ))
      )}

      {transactionsDetails.length > 0 && explorerUrl && (
        <div className="bluxcc:absolute bluxcc:bottom-4 bluxcc:left-1/2 bluxcc:!mt-4 bluxcc:w-[calc(100%-3rem)] bluxcc:-translate-x-1/2 bluxcc:transform">
          <Button
            state="enabled"
            variant="outline"
            size="medium"
            onClick={handleGoToExplorer}
          >
            {t('seeAllInExplorer')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Activity;
