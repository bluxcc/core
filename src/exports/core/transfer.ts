import {
  xdr,
  Memo,
  Asset,
  StrKey,
  Horizon,
  Operation,
  Claimant,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

import { getState } from '../../store';
import { sendTransaction } from '../blux';
import { writeContract } from './writeContract';
import { ISubmittedTransaction } from '../../types';
import { ToScVal, numberish, type Numberish } from './toScVal';
import { checkConfigCreated, getNetwork } from '../utils';
import {
  resolveAsset,
  resolveAddress,
  loadAccount,
  hasTrustline,
  type AssetArg,
} from './helpers';

/** Options for {@link transfer}. */
export type TransferOptions = {
  /**
   * Recipient: a Stellar address (`G...` or muxed `M...`) or a SEP-2 federated
   * address (`alice*example.com`). For a `token` transfer a contract id (`C...`)
   * is also accepted.
   */
  to: string;
  /**
   * Amount to send. Numbers and bigints are coerced to a string. For classic
   * assets this is a decimal amount (`"10.5"`); for a `token` it is the integer
   * base-unit amount the contract expects.
   */
  amount: Numberish;
  /**
   * Asset to send. Accepts `'xlm'` / `'native'`, a `CODE:ISSUER` string, or an
   * `Asset`. Defaults to the native lumen. Ignored when `token` is set.
   */
  asset?: AssetArg;
  /** Optional text memo. Ignored for `token` (Soroban) transfers. */
  memo?: string;
  /**
   * When the recipient cannot receive the asset directly (its account does not
   * exist, or it has no trustline for an issued asset), send a claimable balance
   * it can claim later instead of failing. Defaults to `false`.
   */
  claimable?: boolean;
  /**
   * A SEP-41 token contract id (`C...`). When set, value moves through the
   * contract's `transfer(from, to, amount)` entrypoint instead of a classic op.
   */
  token?: string;
  /** Network passphrase to send on. Defaults to the active network. */
  network?: string;
};

/**
 * Per-operation fee cap in stroops. 0.01 XLM sits comfortably above surge
 * pricing for the single-operation transactions transfer builds.
 */
const TRANSFER_FEE = '100000';

/** Builds an unconditional claimable balance the recipient can claim anytime. */
const claimableBalanceOp = (asset: Asset, amount: string, claimant: string) =>
  Operation.createClaimableBalance({
    asset,
    amount,
    claimants: [new Claimant(claimant, Claimant.predicateUnconditional())],
  });

/**
 * Picks the correct classic operation for the recipient's current state,
 * falling back to a claimable balance when asked and refusing combinations the
 * network would reject.
 */
const buildClassicOperation = (params: {
  asset: Asset;
  amount: string;
  claimable: boolean;
  destination: string;
  publicKey: string;
  destinationAccount: Horizon.AccountResponse | null;
}): xdr.Operation => {
  const {
    asset,
    amount,
    claimable,
    destination,
    publicKey,
    destinationAccount,
  } = params;

  if (destinationAccount) {
    if (hasTrustline(destinationAccount, asset)) {
      return Operation.payment({ destination, asset, amount });
    }

    if (claimable) {
      return claimableBalanceOp(asset, amount, publicKey);
    }

    throw new Error(
      `BLUX: The destination has no trustline for ${asset.getCode()}. Pass { claimable: true } to send it as a claimable balance.`,
    );
  }

  if (claimable) {
    return claimableBalanceOp(asset, amount, publicKey);
  }

  if (asset.isNative()) {
    return Operation.createAccount({
      destination: publicKey,
      startingBalance: amount,
    });
  }

  throw new Error(
    `BLUX: The destination account does not exist, so it can only be created with XLM. Send XLM, or pass { claimable: true } to send ${asset.getCode()} as a claimable balance.`,
  );
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
      return Memo.text(memo);
  }
};

/**
 * Sends value from the logged-in account to `to`, choosing the right mechanism
 * automatically: createAccount for a new recipient, payment for an existing one,
 * a claimable balance when asked, or a SEP-41 contract call when `token` is set.
 * Requires a logged-in account.
 *
 * @param options - Recipient, amount, and how to send — see {@link TransferOptions}.
 * @returns The submitted transaction.
 * @throws If no account is logged in, the inputs are invalid, or the recipient cannot receive the asset (and `claimable` was not set).
 */
export const transfer = async (
  options: TransferOptions,
): Promise<ISubmittedTransaction> => {
  if (!checkConfigCreated()) {
    throw new Error('BLUX: transfer must be called after createConfig');
  }

  if (!options || typeof options !== 'object') {
    throw new Error('BLUX: transfer requires an options object.');
  }

  const { user } = getState();

  if (!user || !user.address) {
    throw new Error('BLUX: No account is logged in.');
  }

  const sourceAddress = user.address;

  const {
    to,
    amount,
    asset = 'native',
    memo,
    claimable = false,
    token,
    network,
  } = options;

  if (!to) {
    throw new Error('BLUX: transfer requires a "to" address.');
  }

  if (amount === undefined || amount === null || (amount as string) === '') {
    throw new Error('BLUX: transfer requires an "amount".');
  }

  const amountString = numberish<string>(amount, 'string');

  if (!(Number(amountString) > 0)) {
    throw new Error('BLUX: transfer "amount" must be greater than zero.');
  }

  if (token) {
    if (!StrKey.isValidContract(token)) {
      throw new Error('BLUX: "token" must be a contract id (C...).');
    }

    if (amountString.includes('.') || /e/i.test(amountString)) {
      throw new Error(
        'BLUX: token transfers use integer base units; "amount" cannot have decimals.',
      );
    }

    const tokenTo = StrKey.isValidContract(to)
      ? to
      : (await resolveAddress(to)).publicKey;

    return writeContract(
      {
        address: token,
        fn: 'transfer',
        args: [
          ToScVal.address(sourceAddress),
          ToScVal.address(tokenTo),
          ToScVal.i128(amountString),
        ],
      },
      { network },
    );
  }

  if (/e/i.test(amountString)) {
    throw new Error(
      'BLUX: "amount" could not be represented precisely; pass it as a string (e.g. "0.0000001").',
    );
  }

  const stellarAsset = resolveAsset(asset);
  const resolved = await resolveAddress(to);
  const { horizon, networkPassphrase } = getNetwork(network);

  const sourceAccount = await loadAccount(horizon, sourceAddress);

  if (!sourceAccount) {
    throw new Error(
      'BLUX: The logged-in account is not active on this network yet.',
    );
  }

  const destinationAccount = await loadAccount(horizon, resolved.publicKey);

  const operation = buildClassicOperation({
    asset: stellarAsset,
    amount: amountString,
    claimable,
    destination: resolved.destination,
    publicKey: resolved.publicKey,
    destinationAccount,
  });

  let builder = new TransactionBuilder(sourceAccount, {
    fee: TRANSFER_FEE,
    networkPassphrase,
  }).addOperation(operation);

  const memoValue = memo ?? resolved.memo;
  const memoType = memo !== undefined ? 'text' : resolved.memoType;
  const builtMemo = buildMemo(memoValue, memoType);

  if (builtMemo) {
    builder = builder.addMemo(builtMemo);
  }

  const builtXdr = builder.setTimeout(180).build().toXDR();

  return sendTransaction(builtXdr, {
    network: networkPassphrase,
  }) as Promise<ISubmittedTransaction>;
};
