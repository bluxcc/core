import {
  xdr,
  Memo,
  Asset,
  StrKey,
  Horizon,
  Operation,
  TransactionBuilder,
  extractBaseAddress,
} from '@stellar/stellar-sdk';
import BigNumber from 'bignumber.js';

import { getState } from '../../store';
import { ISubmittedTransaction } from '../../types';
import { getStrictSendPaths } from './getStrictSendPaths';
import { numberish, type Numberish } from './toScVal';
import { checkConfigCreated, getNetwork } from '../utils';
import { getStrictReceivePaths } from './getStrictReceivePaths';
import { DEFAULT_NETWORKS_TRANSPORTS } from '../../constants/networkDetails';
import {
  resolveAsset,
  resolveAddress,
  loadAccount,
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

const STROOPS_PER_UNIT = new BigNumber(10_000_000);
const BASE_RESERVE_STROOPS = new BigNumber(5_000_000);
const MAX_STROOPS = new BigNumber('9223372036854775807');
const TEXT_MEMO_MAX_BYTES = 28;

type CreditBalance = Horizon.HorizonApi.BalanceLineAsset;

/** Formats an integer stroop amount as a trimmed decimal string (max 7 dp). */
const formatStroops = (stroops: BigNumber): string => {
  const whole = stroops.idiv(STROOPS_PER_UNIT);
  const fraction = stroops
    .mod(STROOPS_PER_UNIT)
    .toFixed(0)
    .padStart(7, '0')
    .replace(/0+$/, '');

  return fraction ? `${whole.toFixed(0)}.${fraction}` : whole.toFixed(0);
};

const toStroops = (amount: string, requireExact = true): BigNumber => {
  const stroops = new BigNumber(amount).times(STROOPS_PER_UNIT);

  if (!stroops.isFinite() || stroops.lte(0)) {
    throw new Error('BLUX: swap "amount" must be greater than zero.');
  }

  if (requireExact && !stroops.isInteger()) {
    throw new Error(
      'BLUX: swap "amount" can have at most 7 decimal places.',
    );
  }

  const rounded = requireExact
    ? stroops
    : stroops.integerValue(BigNumber.ROUND_FLOOR);

  if (rounded.gt(MAX_STROOPS)) {
    throw new Error('BLUX: swap "amount" is too large.');
  }

  return rounded;
};

const assertStellarAmount = (amountString: string): void => {
  const fraction = amountString.split('.')[1];

  if (fraction && fraction.length > 7) {
    throw new Error(
      'BLUX: swap "amount" can have at most 7 decimal places.',
    );
  }

  toStroops(amountString, true);
};

/**
 * Applies the slippage guardrail to a quoted amount: `'down'` for the minimum to
 * receive (exactIn `destMin`), `'up'` for the maximum to send (exactOut
 * `sendMax`). Rounds conservatively so the on-chain bound is never tighter than
 * the user asked for. `destMin` is at least 1 stroop — the network rejects 0.
 */
const applySlippage = (
  amount: string,
  slippage: number,
  direction: 'down' | 'up',
): string => {
  const stroops = toStroops(amount, false);
  const factor = new BigNumber(direction === 'down' ? 1 - slippage : 1 + slippage);
  let result = stroops.times(factor);
  result =
    direction === 'down'
      ? result.integerValue(BigNumber.ROUND_FLOOR)
      : result.integerValue(BigNumber.ROUND_CEIL);

  if (direction === 'down' && result.lt(1)) {
    result = new BigNumber(1);
  }

  if (!result.isFinite() || result.lt(1) || result.gt(MAX_STROOPS)) {
    throw new Error('BLUX: swap amount is too large.');
  }

  return formatStroops(result);
};

/** Converts a Horizon path-record hop list into the intermediary {@link Asset}s. */
const pathToAssets = (
  path: Array<{
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
  }>,
): Asset[] =>
  path.map((hop) => {
    if (hop.asset_type === 'native') {
      return Asset.native();
    }

    if (!hop.asset_code || !hop.asset_issuer) {
      throw new Error('BLUX: Swap path contained an unrecognized asset.');
    }

    return new Asset(hop.asset_code, hop.asset_issuer);
  });

/** Short, human-readable asset label for error messages (`XLM` for native). */
const assetLabel = (asset: Asset): string => asset.getCode();

/** Full asset identity for error messages: `XLM` or `CODE:ISSUER`. */
const assetIdentity = (asset: Asset): string =>
  asset.isNative() ? 'XLM' : `${asset.getCode()}:${asset.getIssuer()}`;

const sourcePublicKeyOf = (address: string): string => {
  if (StrKey.isValidEd25519PublicKey(address)) {
    return address;
  }

  if (StrKey.isValidMed25519PublicKey(address)) {
    return extractBaseAddress(address);
  }

  throw new Error('BLUX: The logged-in account address is invalid.');
};

const findCreditBalance = (
  account: Horizon.AccountResponse,
  asset: Asset,
): CreditBalance | undefined => {
  if (asset.isNative()) {
    return undefined;
  }

  return account.balances.find(
    (balance): balance is CreditBalance =>
      (balance.asset_type === 'credit_alphanum4' ||
        balance.asset_type === 'credit_alphanum12') &&
      balance.asset_code === asset.getCode() &&
      balance.asset_issuer === asset.getIssuer(),
  );
};

const isAuthorized = (line: CreditBalance): boolean =>
  line.is_authorized !== false;

/** Remaining room on a credit trustline, in stroops. Native is unlimited. */
const destRemainingStroops = (
  account: Horizon.AccountResponse,
  asset: Asset,
): BigNumber | 'unlimited' => {
  if (asset.isNative()) {
    return 'unlimited';
  }

  const line = findCreditBalance(account, asset);

  if (!line || !isAuthorized(line)) {
    return new BigNumber(0);
  }

  return new BigNumber(line.limit)
    .minus(line.balance)
    .minus(line.buying_liabilities || '0')
    .times(STROOPS_PER_UNIT);
};

const creditSpendableStroops = (
  account: Horizon.AccountResponse,
  asset: Asset,
): BigNumber => {
  const line = findCreditBalance(account, asset);

  if (!line || !isAuthorized(line)) {
    return new BigNumber(0);
  }

  return new BigNumber(line.balance)
    .minus(line.selling_liabilities || '0')
    .times(STROOPS_PER_UNIT);
};

/**
 * XLM left after selling liabilities and the account's minimum balance,
 * including `extraEntries` not-yet-created ledger entries (a new trustline).
 * Fees are not subtracted here.
 */
const nativeAvailableStroops = (
  account: Horizon.AccountResponse,
  extraEntries: number,
): BigNumber => {
  const line = account.balances.find(
    (balance) => balance.asset_type === 'native',
  );

  if (!line) {
    return new BigNumber(0);
  }

  const entryCount =
    2 +
    (account.subentry_count || 0) +
    (account.num_sponsoring || 0) -
    (account.num_sponsored || 0) +
    extraEntries;

  const selling = new BigNumber(
    'selling_liabilities' in line ? line.selling_liabilities : '0',
  ).times(STROOPS_PER_UNIT);

  return new BigNumber(line.balance)
    .times(STROOPS_PER_UNIT)
    .minus(selling)
    .minus(BASE_RESERVE_STROOPS.times(entryCount));
};

const assertCanAfford = (
  account: Horizon.AccountResponse,
  send: Asset,
  sendAmount: string,
  extraEntries: number,
  extraOps: number,
): void => {
  const feeStroops = new BigNumber(SWAP_FEE).times(1 + extraOps);
  const nativeLeft = nativeAvailableStroops(account, extraEntries);
  const sendStroops = toStroops(sendAmount, false);

  if (send.isNative()) {
    if (nativeLeft.lt(feeStroops.plus(sendStroops))) {
      throw new Error('BLUX: Insufficient balance to swap this amount.');
    }

    return;
  }

  if (nativeLeft.lt(feeStroops)) {
    throw new Error(
      'BLUX: Insufficient XLM to cover the swap fee and trustline reserve.',
    );
  }

  if (creditSpendableStroops(account, send).lt(sendStroops)) {
    throw new Error('BLUX: Insufficient balance to swap this amount.');
  }
};

/** Builds the right {@link Memo} for a value, honoring a federation-declared type. */
const buildMemo = (memo?: string, memoType?: string): Memo | undefined => {
  if (memo === undefined || memo === null || memo === '') {
    return undefined;
  }

  switch (memoType) {
    case 'id':
      return Memo.id(memo);
    case 'hash':
      return Memo.hash(memo);
    case 'return':
      return Memo.return(memo);
    default:
      if (Buffer.byteLength(memo, 'utf8') > TEXT_MEMO_MAX_BYTES) {
        throw new Error('BLUX: swap "memo" must be at most 28 bytes.');
      }

      return Memo.text(memo);
  }
};

/**
 * Picks the route to embed in the path payment. Horizon returns records
 * best-rate first, but some Horizon nodes (the default public one included)
 * reject path payments whose chain is 4+ assets long (2+ intermediary hops), so
 * the best route of at most 3 assets wins; a longer route is used only when no
 * shorter one exists, relying on the configured node to accept it.
 */
const pickPathRecord = (
  records: Horizon.ServerApi.PaymentPathRecord[],
): Horizon.ServerApi.PaymentPathRecord | undefined =>
  records.find((record) => record.path.length < 2) ?? records[0];

/**
 * Builds the "no path" error. The usual cause is an issuer that lives on a
 * different network than the one being queried, so probe the issuer accounts
 * and call that out explicitly instead of letting it read like a liquidity
 * problem.
 */
const noSwapPathError = async (
  horizon: Horizon.Server,
  send: Asset,
  dest: Asset,
  networkPassphrase: string,
): Promise<Error> => {
  const networkName =
    DEFAULT_NETWORKS_TRANSPORTS[networkPassphrase]?.name ?? 'this network';

  for (const asset of [dest, send]) {
    const issuer = asset.getIssuer();

    if (!issuer) {
      continue;
    }

    if (!(await loadAccount(horizon, issuer))) {
      return new Error(
        `BLUX: No swap path found from ${assetLabel(send)} to ${assetLabel(dest)} — the ${asset.getCode()} issuer ${issuer} could not be found on ${networkName}; is it an asset from a different network?`,
      );
    }
  }

  return new Error(
    `BLUX: No swap path found from ${assetIdentity(send)} to ${assetIdentity(dest)} on ${networkName} — no route can fill this amount right now.`,
  );
};

/**
 * Builds the unsigned swap transaction XDR. {@link swap} signs and submits this
 * envelope; the profile Swap page uses it so it can close the modal before
 * opening the signing flow.
 *
 * @param options - What to swap and how — see {@link SwapOptions}.
 * @returns The unsigned transaction envelope as XDR.
 */
export const buildSwapTransaction = async (
  options: SwapOptions,
): Promise<string> => {
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

  const sourcePublicKey = sourcePublicKeyOf(user.address);

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

  if (typeof memo === 'string' && memo !== '') {
    if (Buffer.byteLength(memo, 'utf8') > TEXT_MEMO_MAX_BYTES) {
      throw new Error('BLUX: swap "memo" must be at most 28 bytes.');
    }
  }

  const amountString = numberish<string>(amount, 'string');

  if (!(Number(amountString) > 0) || !Number.isFinite(Number(amountString))) {
    throw new Error('BLUX: swap "amount" must be greater than zero.');
  }

  if (/e/i.test(amountString)) {
    throw new Error(
      'BLUX: "amount" could not be represented precisely; pass it as a string (e.g. "0.0000001").',
    );
  }

  assertStellarAmount(amountString);

  const send = resolveAsset(fromAsset);
  const dest = resolveAsset(toAsset);

  if (send.equals(dest)) {
    throw new Error('BLUX: "fromAsset" and "toAsset" must be different.');
  }

  const resolved = to
    ? await resolveAddress(to)
    : {
        destination: sourcePublicKey,
        publicKey: sourcePublicKey,
        federated: false,
      };

  const { horizon, networkPassphrase } = getNetwork(network);

  const sourceAccount = await loadAccount(horizon, sourcePublicKey);

  if (!sourceAccount) {
    throw new Error(
      'BLUX: The logged-in account is not active on this network yet.',
    );
  }

  const isSelf = resolved.publicKey === sourcePublicKey;
  const destinationAccount = isSelf
    ? sourceAccount
    : await loadAccount(horizon, resolved.publicKey);

  if (!destinationAccount) {
    throw new Error(
      'BLUX: The destination account does not exist; a swap cannot create it.',
    );
  }

  if (!send.isNative()) {
    const sendLine = findCreditBalance(sourceAccount, send);

    if (!sendLine || !isAuthorized(sendLine)) {
      throw new Error(
        `BLUX: You do not have a trustline for ${assetLabel(send)}.`,
      );
    }
  }

  const destLine = findCreditBalance(destinationAccount, dest);

  if (destLine && !isAuthorized(destLine)) {
    throw new Error(
      `BLUX: The destination is not authorized to hold ${assetLabel(dest)}.`,
    );
  }

  const destHasLine = dest.isNative() || !!destLine;

  if (!destHasLine && !isSelf) {
    throw new Error(
      `BLUX: The destination has no trustline for ${assetLabel(dest)}.`,
    );
  }

  let operation: xdr.Operation;
  let quotedOut: string;
  let sendAmount: string;

  if (type === 'exactIn') {
    const { response } = await getStrictSendPaths(
      [send, amountString, [dest]],
      { network },
    );
    const record = pickPathRecord(response.records);

    if (!record) {
      throw await noSwapPathError(horizon, send, dest, networkPassphrase);
    }

    quotedOut = record.destination_amount;
    sendAmount = amountString;
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
    const record = pickPathRecord(response.records);

    if (!record) {
      throw await noSwapPathError(horizon, send, dest, networkPassphrase);
    }

    quotedOut = amountString;
    sendAmount = applySlippage(record.source_amount, slippage, 'up');
    operation = Operation.pathPaymentStrictReceive({
      sendAsset: send,
      sendMax: sendAmount,
      destination: resolved.destination,
      destAsset: dest,
      destAmount: amountString,
      path: pathToAssets(record.path),
    });
  }

  const remaining = destRemainingStroops(destinationAccount, dest);
  const quotedOutStroops = toStroops(quotedOut, false);
  const needsMoreRoom =
    remaining !== 'unlimited' && quotedOutStroops.gt(remaining);
  const addingNewTrustline = !dest.isNative() && !destHasLine;
  const shouldAddTrustline = addingNewTrustline || (isSelf && needsMoreRoom);

  if (needsMoreRoom && !isSelf) {
    throw new Error(
      `BLUX: The destination cannot receive this amount of ${assetLabel(dest)} (trustline limit).`,
    );
  }

  const extraEntries = addingNewTrustline ? 1 : 0;
  const extraOps = shouldAddTrustline ? 1 : 0;

  assertCanAfford(sourceAccount, send, sendAmount, extraEntries, extraOps);

  let builder = new TransactionBuilder(sourceAccount, {
    fee: SWAP_FEE,
    networkPassphrase,
  });

  if (shouldAddTrustline) {
    builder = builder.addOperation(Operation.changeTrust({ asset: dest }));
  }

  builder = builder.addOperation(operation);

  const memoValue = memo ?? resolved.memo;
  const memoType = memo !== undefined ? 'text' : resolved.memoType;
  const builtMemo = buildMemo(memoValue, memoType);

  if (builtMemo) {
    builder = builder.addMemo(builtMemo);
  }

  return builder.setTimeout(180).build().toXDR();
};

/**
 * Swaps one asset for another through the Stellar DEX / liquidity pools using a
 * path payment, picking the best available path automatically. Routes of at
 * most 3 assets (one intermediary hop) are preferred, since longer chains are
 * rejected by some Horizon nodes; a longer route is used only when no shorter
 * one exists. Defaults to a self-swap; pass `to` to deliver the bought asset to
 * another account. When the recipient is the logged-in account and lacks a
 * trustline for `toAsset`, the required `changeTrust` is added automatically.
 * Requires a logged-in account.
 *
 * @param options - What to swap and how — see {@link SwapOptions}.
 * @returns The submitted transaction.
 * @throws If no account is logged in, the inputs are invalid, no path exists, the destination account does not exist, or the destination (when not self) lacks a trustline for `toAsset`.
 */
export const swap = async (
  options: SwapOptions,
): Promise<ISubmittedTransaction> => {
  const builtXdr = await buildSwapTransaction(options);
  const { sendTransaction } = await import('../blux');

  return sendTransaction(builtXdr, {
    network: getNetwork(options.network).networkPassphrase,
  }) as Promise<ISubmittedTransaction>;
};
