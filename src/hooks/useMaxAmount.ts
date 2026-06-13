import { useEffect, useState } from 'react';

import { IAsset } from '../types';
import { useAppStore } from '../store';
import { getMaxSpendableAmount, IReserveInfo } from '../utils/helpers';

// Derives the maximum amount of `asset` the account can send. The reserve
// structure (subentry count + sponsorships) is loaded once per account/network
// because a balance line does not carry it; the amount itself comes from the
// live store balances so it tracks the periodic refresh. Shared by the Send and
// Swap pages so both honor reserves, selling liabilities and the fee buffer.
const useMaxAmount = (asset: IAsset): string => {
  const store = useAppStore((s) => s);
  const [reserve, setReserve] = useState<IReserveInfo | null>(null);

  const address = store.user?.address;
  const horizon = store.stellar?.servers.horizon;
  const network = store.stellar?.activeNetwork;

  useEffect(() => {
    let cancelled = false;

    // A fresh account/network invalidates the previous reserve numbers; clear
    // them so the native max falls back to its optimistic value until reloaded.
    setReserve(null);

    if (!address || !horizon) {
      return;
    }

    horizon
      .loadAccount(address)
      .then((account) => {
        if (cancelled) {
          return;
        }

        setReserve({
          subentryCount: account.subentry_count,
          numSponsoring: account.num_sponsoring,
          numSponsored: account.num_sponsored,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setReserve(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, horizon, network]);

  return getMaxSpendableAmount(asset, store.balances.balances, reserve);
};

export default useMaxAmount;
