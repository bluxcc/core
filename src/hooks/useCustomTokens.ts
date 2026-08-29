import { useEffect, useRef } from 'react';

import { useAppStore } from '../store';
import { apiGetTokens } from '../utils/api';
import {
  apiNetworkSlug,
  readTokenBalance,
  apiTokenToCustomToken,
} from '../utils/customTokens';

/**
 * Keeps the store's custom-token list in sync:
 *
 *  1. On login (a JWT appears), fetch the user's preferred tokens once and store
 *     both network buckets.
 *  2. Whenever the active network's bucket membership, the account, or the
 *     network changes, read each token's on-chain balance and write it back.
 *
 * Mounted once from {@link Provider}, alongside {@link useUpdateAccount}.
 */
const useCustomTokens = () => {
  const JWT = useAppStore((s) => s.auth?.JWT);
  const userAddress = useAppStore((s) => s.user?.address);
  const activeNetwork = useAppStore((s) => s.stellar?.activeNetwork || '');
  const refreshNonce = useAppStore((s) => s.accountRefreshNonce);
  const customTokens = useAppStore((s) => s.customTokens);
  const setCustomTokens = useAppStore((s) => s.setCustomTokens);
  const setCustomTokenBalances = useAppStore((s) => s.setCustomTokenBalances);

  // The JWT this hook last fetched for, so a re-render doesn't refetch but a new
  // login (a different JWT) does.
  const fetchedForJWT = useRef<string>('');

  useEffect(() => {
    if (!JWT) {
      fetchedForJWT.current = '';
      return;
    }

    if (fetchedForJWT.current === JWT) return;
    fetchedForJWT.current = JWT;

    let cancelled = false;

    apiGetTokens(JWT)
      .then((grouped) => {
        if (cancelled) return;

        setCustomTokens({
          mainnet: grouped.mainnet.map((t) => apiTokenToCustomToken(t)),
          testnet: grouped.testnet.map((t) => apiTokenToCustomToken(t)),
        });
      })
      .catch(() => {
        // Token sync is best-effort; a failure just leaves the list empty.
      });

    return () => {
      cancelled = true;
    };
  }, [JWT, setCustomTokens]);

  const slug = apiNetworkSlug(activeNetwork);
  const bucket = customTokens[slug] ?? [];
  // Stable signature of the bucket's membership: changes on add/remove (which
  // should trigger a balance read) but not when only balances change (which
  // must not, or the effect would loop).
  const bucketKey = bucket.map((t) => t.id).join(',');

  useEffect(() => {
    if (!bucket.length || !userAddress) return;

    let cancelled = false;

    (async () => {
      const balances: Record<number, string> = {};

      await Promise.all(
        bucket.map(async (token) => {
          try {
            balances[token.id] = await readTokenBalance(
              token.contractAddress,
              userAddress,
              token.decimals,
              activeNetwork,
            );
          } catch {
            // Leave the previous balance in place on a read failure.
          }
        }),
      );

      if (!cancelled && Object.keys(balances).length) {
        setCustomTokenBalances(slug, balances);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `bucket` is intentionally tracked via the stable `bucketKey` string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    slug,
    bucketKey,
    userAddress,
    activeNetwork,
    refreshNonce,
    setCustomTokenBalances,
  ]);
};

export default useCustomTokens;
