import { useEffect, useRef } from 'react';

import { Route } from '../enums';
import { getState, useAppStore } from '../store';
import useBalances from './useBalances';
import { balanceToAsset } from '../utils/helpers';
import { balanceLineKey, getBalancesUsdValues } from '../utils/prices';

const INTERVAL_MS = 20_000;

const useUpdateAccount = () => {
  const store = useAppStore((s) => s);

  const balancesResult = useBalances();

  const activeNetwork = store.stellar?.activeNetwork || '';
  const isAuthenticated = store.authState.isAuthenticated;
  const userAddress = store.user?.address;
  const modalIsOpen = store.modal.isOpen;
  const modalRoute = store.modal.route;

  // Signature of the balances last priced, so the 20s refresh interval only
  // triggers a (network-heavy) revaluation when the holdings actually change.
  const pricedSignature = useRef<string>('');
  const modalWasOpen = useRef(false);

  const updateAccountDetails = () => {
    store.setBalances(balancesResult);

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
  }, [balancesResult, store.modal.route]);

  useEffect(() => {
    if (!isAuthenticated || !userAddress) {
      return;
    }

    const id = setInterval(() => {
      getState().bumpAccountRefresh();
    }, INTERVAL_MS);

    return () => {
      clearInterval(id);
    };
  }, [isAuthenticated, userAddress, activeNetwork]);

  useEffect(() => {
    const opened = modalIsOpen && !modalWasOpen.current;
    modalWasOpen.current = modalIsOpen;

    if (!opened || !isAuthenticated || !userAddress) {
      return;
    }

    if (modalRoute !== Route.PROFILE) {
      return;
    }

    getState().bumpAccountRefresh();
  }, [modalIsOpen, modalRoute, isAuthenticated, userAddress]);

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
