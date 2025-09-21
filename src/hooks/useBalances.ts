import { useState, useEffect } from "react";
import { Horizon } from "@stellar/stellar-sdk";

import { useAppStore } from "../store";
import getBalances from "../query/getBalances";

export type UseBalancesResult = {
  loading: boolean;
  error: Error | null;
  balances: Horizon.HorizonApi.BalanceLine[];
};

const useBalances = (): UseBalancesResult => {
  const store = useAppStore((store) => store);
  const [result, setResult] = useState<UseBalancesResult>({
    error: null,
    loading: true,
    balances: [],
  });

  const userAddress = store.user?.address as string;

  useEffect(() => {
    setResult({
      error: null,
      loading: true,
      balances: [],
    });

    getBalances({
      address: userAddress,
    })
      .then((result) => {
        setResult({
          error: null,
          loading: false,
          balances: result,
        });
      })
      .catch((err) => {
        setResult({
          error: err,
          loading: false,
          balances: [],
        });
      });
  }, [userAddress, store.stellar?.activeNetwork]);

  return result;
};

export default useBalances;
