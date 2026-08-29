import { Horizon, Networks, StellarToml } from '@stellar/stellar-sdk';

import { IAsset } from '../types';
import { fetcher } from '../utils/helpers';
import { MAINNET_USDC, TESTNET_USDC } from '../constants/assets';

const POLL_MS = 3000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000;

type JsonRecord = Record<string, unknown> & { status: number };

export type MoneygramMemoType = 'text' | 'id' | 'hash';

export type MoneygramSession = {
  url: string;
  id: string;
  token: string;
  transferServer: string;
};

export type MoneygramWithdrawDetails = {
  amount: string;
  destination: string;
  memo: string;
  memoType: MoneygramMemoType;
};

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const homeDomainFor = (network: string): string | null => {
  if (network === Networks.PUBLIC) {
    return 'mgxanchor.moneygram.com';
  }

  if (network === Networks.TESTNET) {
    return 'extmgxanchor.moneygram.com';
  }

  return null;
};

const stripSlash = (url: string) => url.replace(/\/$/, '');

const transferServerOf = (toml: StellarToml.Api.StellarToml): string => {
  const value =
    toml.TRANSFER_SERVER_SEP0024 || asString(toml.TRANSFER_SERVER_SEP24);

  if (!value) {
    throw new Error('BLUX: MoneyGram stellar.toml is missing SEP-24.');
  }

  return stripSlash(value);
};

const memoTypeOf = (value: string): MoneygramMemoType => {
  if (value === 'id' || value === 'hash') {
    return value;
  }

  return 'text';
};

const withCallback = (url: string) => {
  const parsed = new URL(url);

  parsed.searchParams.set('callback', 'postMessage');

  return parsed.toString();
};

const throwIfHttpError = (res: JsonRecord, fallback: string) => {
  if (res.status >= 400) {
    throw new Error(asString(res.error) || asString(res.message) || fallback);
  }
};

export const isMoneygramNetwork = (network: string): boolean =>
  homeDomainFor(network) !== null;

export const moneygramUsdc = (network: string): IAsset =>
  network === Networks.PUBLIC ? MAINNET_USDC : TESTNET_USDC;

export const startMoneygramWithdraw = async ({
  address,
  network,
  lang,
  sign,
  signal,
}: {
  address: string;
  network: string;
  lang?: string;
  sign: (xdr: string) => Promise<string>;
  signal?: AbortSignal;
}): Promise<MoneygramSession> => {
  const homeDomain = homeDomainFor(network);

  if (!homeDomain) {
    throw new Error(
      'BLUX: MoneyGram is only available on mainnet and testnet.',
    );
  }

  const toml = await StellarToml.Resolver.resolve(homeDomain);
  const authEndpoint = toml.WEB_AUTH_ENDPOINT;
  const transferServer = transferServerOf(toml);

  if (!authEndpoint) {
    throw new Error('BLUX: MoneyGram stellar.toml is missing SEP-10.');
  }

  const challenge = await fetcher<JsonRecord>(
    `${stripSlash(authEndpoint)}?account=${encodeURIComponent(address)}`,
    { method: 'GET', signal },
  );

  throwIfHttpError(challenge, 'BLUX: MoneyGram authentication failed.');

  const challengeXdr = asString(challenge.transaction);

  if (!challengeXdr) {
    throw new Error('BLUX: MoneyGram did not return an auth challenge.');
  }

  const signedXdr = await sign(challengeXdr);
  const tokenRes = await fetcher<JsonRecord>(stripSlash(authEndpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedXdr }),
    signal,
  });

  throwIfHttpError(tokenRes, 'BLUX: MoneyGram authentication failed.');

  const token = asString(tokenRes.token);

  if (!token) {
    throw new Error('BLUX: MoneyGram did not return an auth token.');
  }

  const usdc = moneygramUsdc(network);
  const withdraw = await fetcher<JsonRecord>(
    `${transferServer}/transactions/withdraw/interactive`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        asset_code: usdc.assetCode,
        asset_issuer: usdc.assetIssuer,
        account: address,
        lang: lang || 'en',
      }),
      signal,
    },
  );

  throwIfHttpError(withdraw, 'BLUX: MoneyGram withdraw failed.');

  const url = asString(withdraw.url);
  const id = asString(withdraw.id);

  if (!url || !id) {
    throw new Error('BLUX: MoneyGram did not return a withdraw session.');
  }

  return {
    id,
    token,
    transferServer,
    url: withCallback(url),
  };
};

export const waitForMoneygramTransfer = async (
  session: MoneygramSession,
  signal?: AbortSignal,
): Promise<MoneygramWithdrawDetails> => {
  const started = Date.now();

  while (true) {
    if (signal?.aborted) {
      throw new Error('BLUX: MoneyGram cash-out cancelled.');
    }

    if (Date.now() - started > POLL_TIMEOUT_MS) {
      throw new Error('BLUX: MoneyGram cash-out timed out.');
    }

    const res = await fetcher<JsonRecord>(
      `${session.transferServer}/transaction?id=${encodeURIComponent(session.id)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${session.token}` },
        signal,
      },
    );

    throwIfHttpError(res, 'BLUX: MoneyGram transaction lookup failed.');

    const tx =
      res.transaction && typeof res.transaction === 'object'
        ? (res.transaction as Record<string, unknown>)
        : {};
    const status = asString(tx.status);

    if (status === 'error' || status === 'expired') {
      throw new Error(
        asString(tx.message) || `BLUX: MoneyGram cash-out ${status}.`,
      );
    }

    if (status === 'pending_user_transfer_start') {
      const destination = asString(tx.withdraw_anchor_account);
      const amount = asString(tx.amount_in);
      const memo = asString(tx.withdraw_memo);

      if (!destination || !amount) {
        throw new Error('BLUX: MoneyGram did not return deposit details.');
      }

      return {
        amount,
        destination,
        memo,
        memoType: memoTypeOf(asString(tx.withdraw_memo_type)),
      };
    }

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('BLUX: MoneyGram cash-out cancelled.'));
        return;
      }

      const id = window.setTimeout(resolve, POLL_MS);

      signal?.addEventListener(
        'abort',
        () => {
          window.clearTimeout(id);
          reject(new Error('BLUX: MoneyGram cash-out cancelled.'));
        },
        { once: true },
      );
    });
  }
};

export const assertHorizon = (horizon?: Horizon.Server): Horizon.Server => {
  if (!horizon) {
    throw new Error('BLUX: Horizon is not configured.');
  }

  return horizon;
};
