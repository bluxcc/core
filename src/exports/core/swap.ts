import {
  xdr,
  Memo,
  Asset,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

import { getState } from '../../store';
import { sendTransaction } from '../blux';
import { ISubmittedTransaction } from '../../types';
import { getStrictSendPaths } from './getStrictSendPaths';
import { numberish, type Numberish } from './toScVal';
import { checkConfigCreated, getNetwork } from '../utils';
import { getStrictReceivePaths } from './getStrictReceivePaths';
import {
  resolveAsset,
  resolveAddress,
  loadAccount,
  hasTrustline,
  type AssetArg,
} from './helpers';

/**
 * Which side of the swap is fixed:
 *
 * - `'exactIn'` — send exactly `amount` of `fromAsset` (the received amount floats).
 * - `'exactOut'` — receive exactly `amount` of `toAsset` (the sent amount floats).
 */
export type SwapType = 'exactIn' | 'exactOut';

/** Options for {@link swap}. */
export type SwapOptions = {
  /** Asset being sold. Accepts `'xlm'` / `'native'`, a `CODE:ISSUER` string, or an `Asset`. */
  fromAsset: AssetArg;
  /** Asset being bought. Accepts `'xlm'` / `'native'`, a `CODE:ISSUER` string, or an `Asset`. */
  toAsset: AssetArg;
  /**
   * The fixed amount. For `'exactIn'` this is how much `fromAsset` to send; for
   * `'exactOut'` it is how much `toAsset` to receive. Numbers and bigints are
   * coerced to a string.
   */
  amount: Numberish;
  /** Which side is fixed. Defaults to `'exactIn'`. */
  type?: SwapType;
  /**
   * Where the bought asset is delivered: a Stellar address (`G...`/`M...`) or a
   * SEP-2 federated address. Defaults to the logged-in account (a self-swap).
   */
  to?: string;
  /**
   * Maximum acceptable slippage as a fraction, where `0.005` = 0.5%. Sets the
   * `destMin` (exactIn) / `sendMax` (exactOut) guardrail off the quoted price.
   * Defaults to `0.005`.
   */
  slippage?: number;
  /** Optional text memo to attach to the transaction. */
  memo?: string;
  /** Network passphrase to swap on. Defaults to the active network. */
  network?: string;
};

/**
 * Per-operation fee cap in stroops. 0.01 XLM sits comfortably above surge
 * pricing for the one-or-two-operation transactions swap builds.
 */
const SWAP_FEE = '100000';

const STROOPS_PER_UNIT = 10_000_000;

/** Formats an integer stroop amount as a trimmed decimal string (max 7 dp). */
const formatStroops = (stroops: number): string => {
  const whole = Math.floor(stroops / STROOPS_PER_UNIT);
  const fraction = String(stroops % STROOPS_PER_UNIT)
    .padStart(7, '0')
    .replace(/0+$/, '');

  return fraction ? `${whole}.${fraction}` : `${whole}`;
};

/**
 * Applies the slippage guardrail to a quoted amount: `'down'` for the minimum to
 * receive (exactIn `destMin`), `'up'` for the maximum to send (exactOut
 * `sendMax`). Rounds conservatively so the on-chain bound is never tighter than
 * the user asked for.
 */
const applySlippage = (
  amount: string,
  slippage: number,
  direction: 'down' | 'up',
): string => {
  const factor = direction === 'down' ? 1 - slippage : 1 + slippage;
  const stroops = Number(amount) * STROOPS_PER_UNIT * factor;

  return formatStroops(
    direction === 'down' ? Math.floor(stroops) : Math.ceil(stroops),
  );
};

/** Converts a Horizon path-record hop list into the intermediary {@link Asset}s. */
const pathToAssets = (
  path: Array<{ asset_type: string; asset_code?: string; asset_issuer?: string }>,
): Asset[] =>
  path.map((hop) =>
    hop.asset_type === 'native'
      ? Asset.native()
      : new Asset(hop.asset_code as string, hop.asset_issuer as string),
  );

/** Short, human-readable asset label for error messages (`XLM` for native). */
const assetLabel = (asset: Asset): string => asset.getCode();

/**
 * Swaps one asset for another through the Stellar DEX / liquidity pools using a
 * path payment, picking the best available path automatically. Defaults to a
 * self-swap; pass `to` to deliver the bought asset to another account. When the
 * recipient is the logged-in account and lacks a trustline for `toAsset`, the
 * required `changeTrust` is added automatically. Requires a logged-in account.
 *
 * @param options - What to swap and how — see {@link SwapOptions}.
 * @returns The submitted transaction.
 * @throws If no account is logged in, the inputs are invalid, no path exists, the destination account does not exist, or the destination (when not self) lacks a trustline for `toAsset`.
 */
export const swap = async (
  options: SwapOptions,
): Promise<ISubmittedTransaction> => {
  if (!checkConfigCreated()) {
    throw new Error('BLUX: swap must be called after createConfig');
  }

  if (!options || typeof options !== 'object') {
    throw new Error('BLUX: swap requires an options object.');
  }

  const { user } = getState();

  if (!user || !user.address) {
    throw new Error('BLUX: No account is logged in.');
  }

  const sourceAddress = user.address;

  const {
    fromAsset,
    toAsset,
    amount,
    type = 'exactIn',
    to,
    slippage = 0.005,
    memo,
    network,
  } = options;

  if (fromAsset === undefined || toAsset === undefined) {
    throw new Error('BLUX: swap requires "fromAsset" and "toAsset".');
  }

  if (amount === undefined || amount === null || (amount as string) === '') {
    throw new Error('BLUX: swap requires an "amount".');
  }

  if (type !== 'exactIn' && type !== 'exactOut') {
    throw new Error('BLUX: swap "type" must be "exactIn" or "exactOut".');
  }

  if (!(slippage >= 0 && slippage < 1)) {
    throw new Error(
      'BLUX: swap "slippage" must be a fraction between 0 and 1 (e.g. 0.005 for 0.5%).',
    );
  }

  const amountString = numberish<string>(amount, 'string');

  if (!(Number(amountString) > 0)) {
    throw new Error('BLUX: swap "amount" must be greater than zero.');
  }

  if (/e/i.test(amountString)) {
    throw new Error(
      'BLUX: "amount" could not be represented precisely; pass it as a string (e.g. "0.0000001").',
    );
  }

  const send = resolveAsset(fromAsset);
  const dest = resolveAsset(toAsset);

  if (send.equals(dest)) {
    throw new Error('BLUX: "fromAsset" and "toAsset" must be different.');
  }

  const resolved = to
    ? await resolveAddress(to)
    : { destination: sourceAddress, publicKey: sourceAddress };

  const { horizon, networkPassphrase } = getNetwork(network);

  const sourceAccount = await loadAccount(horizon, sourceAddress);

  if (!sourceAccount) {
    throw new Error(
      'BLUX: The logged-in account is not active on this network yet.',
    );
  }

  const isSelf = resolved.publicKey === sourceAddress;
  const destinationAccount = isSelf
    ? sourceAccount
    : await loadAccount(horizon, resolved.publicKey);

  if (!destinationAccount) {
    throw new Error(
      'BLUX: The destination account does not exist; a swap cannot create it.',
    );
  }

  const needsTrustline = !hasTrustline(destinationAccount, dest);

  if (needsTrustline && !isSelf) {
    throw new Error(
      `BLUX: The destination has no trustline for ${assetLabel(dest)}.`,
    );
  }

  // Discover the best path and derive the slippage-protected bound.
  let operation: xdr.Operation;

  if (type === 'exactIn') {
    const { response } = await getStrictSendPaths(
      [send, amountString, [dest]],
      { network },
    );
    const record = response.records[0];

    if (!record) {
      throw new Error(
        `BLUX: No swap path found from ${assetLabel(send)} to ${assetLabel(dest)}.`,
      );
    }

    operation = Operation.pathPaymentStrictSend({
      sendAsset: send,
      sendAmount: amountString,
      destination: resolved.destination,
      destAsset: dest,
      destMin: applySlippage(record.destination_amount, slippage, 'down'),
      path: pathToAssets(record.path),
    });
  } else {
    const { response } = await getStrictReceivePaths(
      [[send], dest, amountString],
      { network },
    );
    const record = response.records[0];

    if (!record) {
      throw new Error(
        `BLUX: No swap path found from ${assetLabel(send)} to ${assetLabel(dest)}.`,
      );
    }

    operation = Operation.pathPaymentStrictReceive({
      sendAsset: send,
      sendMax: applySlippage(record.source_amount, slippage, 'up'),
      destination: resolved.destination,
      destAsset: dest,
      destAmount: amountString,
      path: pathToAssets(record.path),
    });
  }

  let builder = new TransactionBuilder(sourceAccount, {
    fee: SWAP_FEE,
    networkPassphrase,
  });

  // A self-swap into a never-held asset needs its trustline first.
  if (needsTrustline) {
    builder = builder.addOperation(Operation.changeTrust({ asset: dest }));
  }

  builder = builder.addOperation(operation);

  if (memo) {
    builder = builder.addMemo(Memo.text(memo));
  }

  const builtXdr = builder.setTimeout(180).build().toXDR();

  return sendTransaction(builtXdr, {
    network: networkPassphrase,
  }) as Promise<ISubmittedTransaction>;
};
