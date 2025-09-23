import { useEffect } from "react";

import { useAppStore } from "../store";
import useBalances from "./useBalances";
import useTransactions from "./useTransactions";

const INTERVAL = 10000;

const useUpdateAccount = () => {
  const store = useAppStore((store) => store);

  const balancesResult = useBalances();
  const transactionsResult = useTransactions();

  const updateAccountDetails = () => {
    store.setBalances(balancesResult);
    store.setTransactions(transactionsResult);
  };

  useEffect(() => {
    updateAccountDetails();

    const i = setInterval(() => {
      updateAccountDetails();
    }, INTERVAL);

    return () => {
      clearInterval(i);
    };
  }, [balancesResult, transactionsResult]);
};

export default useUpdateAccount;
