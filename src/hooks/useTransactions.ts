import { useEffect, useRef, useState } from 'react';
import { Horizon, StrKey } from '@stellar/stellar-sdk';

import { useAppStore } from '../store';
import { getTransactions } from '../exports';

interface TransactionRecordWithOperations
  extends Omit<Horizon.ServerApi.TransactionRecord, 'operations'> {
  operations: Horizon.ServerApi.OperationRecord[];
}

export type UseTransactionsResult = {
  loading: boolean;
  error: Error | null;
  transactions: TransactionRecordWithOperations[];
};

const EMPTY: UseTransactionsResult = {
  error: null,
  loading: false,
  transactions: [],
};

const isFetchableAddress = (address?: string) =>
  !!address &&
  (StrKey.isValidEd25519PublicKey(address) ||
    StrKey.isValidMed25519PublicKey(address));

/**
 * Horizon activity for the signed-in account. Mount this only from the
 * Activity page — listing txs and then fetching each one's operations is
 * expensive and should not run in the background.
 */
const useTransactions = (): UseTransactionsResult => {
  const userAddress = useAppStore((s) => s.user?.address);
  const activeNetwork = useAppStore((s) => s.stellar?.activeNetwork || '');
  const refreshNonce = useAppStore((s) => s.accountRefreshNonce);

  const canFetch = isFetchableAddress(userAddress) && !!activeNetwork;
  const identity = `${userAddress ?? ''}|${activeNetwork}`;

  const [result, setResult] = useState<UseTransactionsResult>(() =>
    canFetch ? { error: null, loading: true, transactions: [] } : EMPTY,
  );
  const [seenIdentity, setSeenIdentity] = useState(identity);

  // Drop the previous account/network's rows on the same render so the
  // activity list never shows leftover history from another identity.
  if (identity !== seenIdentity) {
    setSeenIdentity(identity);
    setResult(
      canFetch ? { error: null, loading: true, transactions: [] } : EMPTY,
    );
  }

  const requestId = useRef(0);

  useEffect(() => {
    if (!canFetch || !userAddress) {
      setResult(EMPTY);
      return;
    }

    const id = ++requestId.current;
    let cancelled = false;

    setResult((prev) => ({
      error: null,
      loading: prev.transactions.length === 0,
      transactions: prev.transactions,
    }));

    getTransactions({
      limit: 5,
      order: 'desc',
      forAccount: userAddress,
      network: activeNetwork,
    })
      .then(async (page) => {
        const txs = page.response.records;

        const operations = await Promise.all(
          txs.map((tx) =>
            tx
              .operations()
              .then((ops) => ops.records)
              .catch(() => [] as Horizon.ServerApi.OperationRecord[]),
          ),
        );

        if (cancelled || id !== requestId.current) {
          return;
        }

        setResult({
          error: null,
          loading: false,
          transactions: txs.map((tx, i) => ({
            ...tx,
            operations: operations[i],
          })) as TransactionRecordWithOperations[],
        });
      })
      .catch((err) => {
        if (cancelled || id !== requestId.current) {
          return;
        }

        const status = (err as { response?: { status?: number } })?.response
          ?.status;

        if (status === 404) {
          setResult({ error: null, loading: false, transactions: [] });
          return;
        }

        setResult((prev) => ({
          error: err,
          loading: false,
          transactions: prev.transactions,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [userAddress, activeNetwork, refreshNonce, canFetch]);

  return result;
};

export default useTransactions;
