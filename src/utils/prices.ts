import BigNumber from 'bignumber.js';
import { Asset, Networks, Horizon } from '@stellar/stellar-sdk';

import { MAINNET_USDC } from '../constants/assets';
import { getOrderbook } from '../exports/core/getOrderbook';

type BalanceLine = Horizon.HorizonApi.BalanceLine;
type Bid = { price: string; amount: string };

// Pull as much depth as Horizon will return so the price-impact walk reaches
// realistic numbers for larger holdings instead of stopping at the top of book.
const ORDERBOOK_LIMIT = 200;

// Stored/Computed values are kept to the same 7-decimal precision Stellar uses
// for amounts; the UI formats them for display (see `formatUsd`).
const VALUE_DECIMALS = 7;

/**
 * Stable key for a balance line used to index its computed USD value. Native is
 * `'native'`, liquidity pools use their pool id, every other asset uses
 * `CODE:ISSUER` — matching {@link assetValueKey} so the UI can look values up.
 */
export const balanceLineKey = (balance: BalanceLine): string => {
  if (balance.asset_type === 'native') {
    return 'native';
  }

  if (balance.asset_type === 'liquidity_pool_shares') {
    return `lp:${balance.liquidity_pool_id}`;
  }

  return `${balance.asset_code}:${balance.asset_issuer}`;
};

/** Same key as {@link balanceLineKey} but from an {@link IAsset}-style triple. */
export const assetValueKey = (
  assetType: string,
  assetCode: string,
  assetIssuer: string,
): string => {
  if (assetType === 'native') {
    return 'native';
  }

  return `${assetCode}:${assetIssuer}`;
};

const isMainnetUsdc = (balance: BalanceLine): boolean =>
  (balance.asset_type === 'credit_alphanum4' ||
    balance.asset_type === 'credit_alphanum12') &&
  balance.asset_code === 'USDC' &&
  balance.asset_issuer === MAINNET_USDC.assetIssuer;

/**
 * Simulates selling `sellBase` units of the base asset into a list of bids
 * (best price first), returning the counter-asset proceeds. Bids are walked
 * level by level so the result reflects price impact, not just the top quote.
 *
 * Horizon denominates `bids[].amount` in the COUNTER asset and `price` as
 * counter-per-base, so each level can absorb `amount / price` units of base.
 * Every value goes through BigNumber and any non-finite level (zero/garbage
 * price, e.g. from a malformed dust offer) is skipped, so the running total can
 * never become `NaN`/`Infinity`.
 */
const sellBaseIntoBids = (bids: Bid[], sellBase: BigNumber): BigNumber => {
  if (!sellBase.isFinite() || sellBase.lte(0)) {
    return new BigNumber(0);
  }

  let remaining = sellBase;
  let received = new BigNumber(0);

  for (const bid of bids) {
    if (remaining.lte(0)) {
      break;
    }

    const price = new BigNumber(bid.price);
    const counterAtLevel = new BigNumber(bid.amount);

    if (
      !price.isFinite() ||
      price.lte(0) ||
      !counterAtLevel.isFinite() ||
      counterAtLevel.lte(0)
    ) {
      continue;
    }

    const baseAtLevel = counterAtLevel.div(price);
    const takeBase = BigNumber.minimum(remaining, baseAtLevel);

    received = received.plus(takeBase.times(price));
    remaining = remaining.minus(takeBase);
  }

  return received;
};

// Clamps a computed value to a finite, non-negative string. Anything the math
// could not produce sanely (negative, NaN, Infinity) collapses to '0'.
const sanitizeValue = (value: BigNumber): string => {
  if (!value.isFinite() || value.isNaN() || value.lte(0)) {
    return '0';
  }

  return value.decimalPlaces(VALUE_DECIMALS, BigNumber.ROUND_DOWN).toString();
};

const fetchBids = async (
  selling: Asset,
  buying: Asset,
  network: string,
): Promise<Bid[]> => {
  try {
    const { response } = await getOrderbook([selling, buying], {
      network,
      limit: ORDERBOOK_LIMIT,
    });

    return response.bids;
  } catch {
    return [];
  }
};

const valueBalanceLine = async (
  balance: BalanceLine,
  usdc: Asset,
  xlmUsdcBids: Bid[],
  network: string,
): Promise<string> => {
  const amount = new BigNumber(balance.balance ?? '0');

  // Guards the NFT/dust case up front: a balance like 0.0000001 just produces a
  // tiny finite value, and a missing/garbage balance produces '0' — never NaN.
  if (!amount.isFinite() || amount.lte(0)) {
    return '0';
  }

  // USDC is the unit of account, so it is worth its face amount.
  if (isMainnetUsdc(balance)) {
    return sanitizeValue(amount);
  }

  // XLM is valued directly off the shared XLM/USDC book.
  if (balance.asset_type === 'native') {
    return sanitizeValue(sellBaseIntoBids(xlmUsdcBids, amount));
  }

  // Liquidity-pool shares have no single order book to price against.
  if (balance.asset_type === 'liquidity_pool_shares') {
    return '0';
  }

  const asset = new Asset(balance.asset_code, balance.asset_issuer);

  // Value against USDC directly and via XLM, then keep the better venue. Each
  // route is a full independent walk, so no book is double-counted.
  const directBids = await fetchBids(asset, usdc, network);
  const directUsd = sellBaseIntoBids(directBids, amount);

  const xlmBids = await fetchBids(asset, Asset.native(), network);
  const routedXlm = sellBaseIntoBids(xlmBids, amount);
  const routedUsd = sellBaseIntoBids(xlmUsdcBids, routedXlm);

  return sanitizeValue(BigNumber.maximum(directUsd, routedUsd));
};

/**
 * Computes the realistic USD value of each balance by selling the full held
 * amount into the live DEX order book (price-impact aware), keyed by
 * {@link balanceLineKey}.
 *
 * Real USD pricing only runs on mainnet, where USDC carries real-world value;
 * on every other network all values resolve to `'0'`. Per-asset failures are
 * isolated, so one unpriceable asset never blanks the rest.
 *
 * @param balances - The account's balance lines.
 * @param network - Active network passphrase.
 * @returns A map of `balanceLineKey` → USD value string (7-dp, never NaN/Infinity).
 */
export const getBalancesUsdValues = async (
  balances: BalanceLine[],
  network: string,
): Promise<Record<string, string>> => {
  const values: Record<string, string> = {};

  if (network !== Networks.PUBLIC) {
    for (const balance of balances) {
      values[balanceLineKey(balance)] = '0';
    }

    return values;
  }

  const usdc = new Asset('USDC', MAINNET_USDC.assetIssuer);

  // Fetched once: prices XLM itself and is reused to route every other asset
  // (A → XLM → USDC) without an extra request per asset.
  const xlmUsdcBids = await fetchBids(Asset.native(), usdc, network);

  await Promise.all(
    balances.map(async (balance) => {
      const key = balanceLineKey(balance);

      try {
        values[key] = await valueBalanceLine(balance, usdc, xlmUsdcBids, network);
      } catch {
        values[key] = '0';
      }
    }),
  );

  return values;
};
