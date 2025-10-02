import { useEffect } from 'react';

import { Route } from '../enums';
import { useAppStore } from '../store';
import useBalances from './useBalances';
import useTransactions from './useTransactions';
import { balanceToAsset } from '../utils/helpers';

const INTERVAL = 10000;

const useUpdateAccount = () => {
  const store = useAppStore((store) => store);

  const balancesResult = useBalances();
  const transactionsResult = useTransactions();

  const updateAccountDetails = () => {
    store.setBalances(balancesResult);
    store.setTransactions(transactionsResult);

    storeXLMAsSelectedAsset();
  };

  const storeXLMAsSelectedAsset = () => {
    const balances = balancesResult.balances;
    const xlmAsset = balances.find((ast) => ast.asset_type === 'native');

    if (
      store.modal.route !== Route.SEND &&
      store.modal.route !== Route.SWAP &&
      store.modal.route !== Route.SELECT_ASSET &&
      balances.length !== 0 &&
      xlmAsset
    ) {
      store.setSelectAsset({
        ...store.selectAsset,
        asset: balanceToAsset(xlmAsset),
      });
    }
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
