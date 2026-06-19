import { useEffect, useRef } from 'react';

import { Route } from '../enums';
import { useAppStore } from '../store';
import useBalances from './useBalances';
import useTransactions from './useTransactions';
import { balanceToAsset } from '../utils/helpers';
import { balanceLineKey, getBalancesUsdValues } from '../utils/prices';

const INTERVAL = 10000;

const useUpdateAccount = () => {
  const store = useAppStore((store) => store);

  const balancesResult = useBalances();
  const transactionsResult = useTransactions();

  const activeNetwork = store.stellar?.activeNetwork || '';

  // Signature of the balances last priced, so the 10s refresh interval only
  // triggers a (network-heavy) revaluation when the holdings actually change.
  const pricedSignature = useRef<string>('');

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
      let swapToAsset = balanceToAsset(xlmAsset);

      if (balances.length > 1) {
        swapToAsset = balanceToAsset(balances[1]);
      }

      store.setSelectAsset({
        ...store.selectAsset,
        swapToAsset,
        sendAsset: balanceToAsset(xlmAsset),
        swapFromAsset: balanceToAsset(xlmAsset),
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
  }, [balancesResult, transactionsResult, store.modal.route]);

  // Price each balance against the live order book whenever the holdings (or
  // network) change. Keyed off a content signature so the periodic balance
  // refresh doesn't refetch order books when nothing actually moved.
  useEffect(() => {
    if (balancesResult.loading || balancesResult.error) {
      return;
    }

    const balances = balancesResult.balances;

    const signature =
      activeNetwork +
      '|' +
      balances.map((b) => `${balanceLineKey(b)}@${b.balance}`).join(',');

    if (signature === pricedSignature.current) {
      return;
    }

    pricedSignature.current = signature;

    if (!balances.length) {
      store.setBalanceValues({});
      return;
    }

    let cancelled = false;

    getBalancesUsdValues(balances, activeNetwork)
      .then((values) => {
        if (!cancelled) {
          store.setBalanceValues(values);
        }
      })
      .catch(() => {
        // Pricing is best-effort; leave any previously computed values in place.
      });

    return () => {
      cancelled = true;
    };
  }, [balancesResult, activeNetwork]);
};

export default useUpdateAccount;
