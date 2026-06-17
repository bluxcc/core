import { Networks, StrKey } from '@stellar/stellar-sdk';

import { getAddress } from '../utils';
import { fetcher } from '../../utils/helpers';

const FRIENDBOT_URLS: Record<string, string> = {
  [Networks.TESTNET]: 'https://friendbot.stellar.org',
  [Networks.FUTURENET]: 'https://friendbot-futurenet.stellar.org',
};

const NAME_TO_PASSPHRASE: Record<string, string> = {
  testnet: Networks.TESTNET,
  futurenet: Networks.FUTURENET,
};

const PASSPHRASE_TO_NAME: Record<string, string> = {
  [Networks.TESTNET]: 'testnet',
  [Networks.FUTURENET]: 'futurenet',
};

export type FundAccountStatus = 'funded' | 'already_funded' | 'failed';

export type FundAccountOptions = {
  network?: string | string[];
};

export type FundAccountResult = {
  network: string;
  passphrase: string;
  status: FundAccountStatus;
  hash?: string;
  error?: string;
};

const resolveFundable = (value: string): string | null => {
  const trimmed = value.trim();

  if (FRIENDBOT_URLS[trimmed]) {
    return trimmed;
  }

  return NAME_TO_PASSPHRASE[trimmed.toLowerCase()] ?? null;
};

const isAlreadyFunded = (body: unknown): boolean => {
  const ops = (body as { extras?: { result_codes?: { operations?: unknown } } })
    ?.extras?.result_codes?.operations;

  if (Array.isArray(ops) && ops.includes('op_already_exists')) {
    return true;
  }

  const blob = JSON.stringify(body ?? {}).toLowerCase();

  return (
    blob.includes('op_already_exists') ||
    blob.includes('already_exists') ||
    blob.includes('already exists') ||
    blob.includes('already funded')
  );
};

const fundOne = async (
  address: string,
  passphrase: string,
): Promise<FundAccountResult> => {
  const result: FundAccountResult = {
    network: PASSPHRASE_TO_NAME[passphrase] ?? passphrase,
    passphrase,
    status: 'failed',
  };

  try {
    const response = await fetcher<{
      status: number;
      hash?: string;
      detail?: string;
      title?: string;
    }>(`${FRIENDBOT_URLS[passphrase]}?addr=${encodeURIComponent(address)}`, {
      method: 'GET',
    });

    if (response.status >= 200 && response.status < 300) {
      result.status = 'funded';
      result.hash = response.hash;

      return result;
    }

    if (isAlreadyFunded(response)) {
      result.status = 'already_funded';

      return result;
    }

    result.error =
      response.detail ||
      response.title ||
      `Friendbot responded with status ${response.status}`;

    return result;
  } catch (cause) {
    result.error =
      cause instanceof Error ? cause.message : 'Friendbot request failed';

    return result;
  }
};

export const fundAccount = async (
  address?: string,
  options: FundAccountOptions = {},
): Promise<FundAccountResult[]> => {
  const target = getAddress(address);

  if (!StrKey.isValidEd25519PublicKey(target)) {
    throw new Error('BLUX: Invalid address');
  }

  let requested: string[];

  if (options.network === undefined) {
    requested = [Networks.TESTNET, Networks.FUTURENET];
  } else if (Array.isArray(options.network)) {
    requested = options.network;
  } else {
    requested = [options.network];
  }

  if (requested.length === 0) {
    throw new Error('BLUX: options.network must not be empty');
  }

  const passphrases: string[] = [];

  for (const value of requested) {
    const passphrase = resolveFundable(value);

    if (!passphrase) {
      throw new Error(
        `BLUX: '${value}' is not fundable. Friendbot only supports testnet and futurenet.`,
      );
    }

    if (!passphrases.includes(passphrase)) {
      passphrases.push(passphrase);
    }
  }

  return Promise.all(passphrases.map((p) => fundOne(target, p)));
};
