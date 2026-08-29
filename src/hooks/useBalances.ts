import { useEffect, useRef, useState } from 'react';
import { Horizon, StrKey } from '@stellar/stellar-sdk';

import { useAppStore } from '../store';
import { getBalances } from '../exports';

export type UseBalancesResult = {
  loading: boolean;
  error: Error | null;
  balances: Horizon.HorizonApi.BalanceLine[];
};

const EMPTY: UseBalancesResult = {
  error: null,
  loading: false,
  balances: [],
};

const isFetchableAddress = (address?: string) =>
  !!address &&
  (StrKey.isValidEd25519PublicKey(address) ||
    StrKey.isValidMed25519PublicKey(address));

const useBalances = (): UseBalancesResult => {
  const userAddress = useAppStore((s) => s.user?.address);
  const activeNetwork = useAppStore((s) => s.stellar?.activeNetwork || '');
  const refreshNonce = useAppStore((s) => s.accountRefreshNonce);

  const canFetch = isFetchableAddress(userAddress) && !!activeNetwork;
  const identity = `${userAddress ?? ''}|${activeNetwork}`;

  const [result, setResult] = useState<UseBalancesResult>(EMPTY);
  const [seenIdentity, setSeenIdentity] = useState(identity);

  if (identity !== seenIdentity) {
    setSeenIdentity(identity);
    setResult(canFetch ? { error: null, loading: true, balances: [] } : EMPTY);
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
      loading: prev.balances.length === 0,
      balances: prev.balances,
    }));

    getBalances({
      address: userAddress,
      network: activeNetwork,
    })
      .then((balances) => {
        if (cancelled || id !== requestId.current) {
          return;
        }

        setResult({
          error: null,
          loading: false,
          balances,
        });
      })
      .catch((err) => {
        if (cancelled || id !== requestId.current) {
          return;
        }

        setResult((prev) => ({
          error: err,
          loading: false,
          balances: prev.balances,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [userAddress, activeNetwork, refreshNonce, canFetch]);

  return result;
};

export default useBalances;
