import { Networks } from '@stellar/stellar-sdk';

import { IAsset } from '../types';

export const XLM = {
  assetIssuer: '',
  assetCode: 'XLM',
  assetBalance: '0',
  assetType: 'native',
};

export const MAINNET_USDC = {
  assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  assetCode: 'USDC',
  assetBalance: '0',
  assetType: 'credit_alphanum4',
};

// Circle's testnet USDC. Must not be confused with the mainnet issuer above —
// that account is not Circle on Testnet, so swaps would have no path.
export const TESTNET_USDC = {
  assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  assetCode: 'USDC',
  assetBalance: '0',
  assetType: 'credit_alphanum4',
};

// Circle's EURC (home_domain circle.com). Testnet has no canonical EURC
// issuer (quarterly resets wipe it), so EURC is suggested on mainnet only.
export const MAINNET_EURC = {
  assetIssuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  assetCode: 'EURC',
  assetBalance: '0',
  assetType: 'credit_alphanum4',
};

const PUBLIC_NETWORK_IDS = new Set([
  Networks.PUBLIC,
  'mainnet',
  'pubnet',
  'stellar:pubnet',
]);

const TESTNET_NETWORK_IDS = new Set([
  Networks.TESTNET,
  'testnet',
  'stellar:testnet',
]);

export const isPublicNetwork = (network: string): boolean =>
  PUBLIC_NETWORK_IDS.has(network);

export const isTestnetNetwork = (network: string): boolean =>
  TESTNET_NETWORK_IDS.has(network);

/** Circle USDC for the active network. Testnet uses Circle's test issuer. */
export const usdcForNetwork = (network: string): IAsset =>
  isPublicNetwork(network) ? MAINNET_USDC : TESTNET_USDC;

/**
 * Curated logos are pubnet-only. Map a well-known testnet (or same-network)
 * issuer to the pubnet issuer whose icon we should reuse.
 */
export const pubnetLogoIssuer = (
  assetCode: string,
  assetIssuer: string,
): string | undefined => {
  if (
    assetCode === 'USDC' &&
    (assetIssuer === TESTNET_USDC.assetIssuer ||
      assetIssuer === MAINNET_USDC.assetIssuer)
  ) {
    return MAINNET_USDC.assetIssuer;
  }

  if (assetCode === 'EURC' && assetIssuer === MAINNET_EURC.assetIssuer) {
    return MAINNET_EURC.assetIssuer;
  }

  return undefined;
};

// Well-known assets offered as swap destinations even when the user does not
// hold them yet (the swap adds a changeTrust operation in that case).
export const getSuggestedAssets = (network: string): IAsset[] => {
  if (isPublicNetwork(network)) {
    return [MAINNET_USDC, MAINNET_EURC];
  }

  if (isTestnetNetwork(network)) {
    return [TESTNET_USDC];
  }

  return [];
};
