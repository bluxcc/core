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

// Well-known assets offered as swap destinations even when the user does not
// hold them yet (the swap adds a changeTrust operation in that case).
export const getSuggestedAssets = (networkPassphrase: string): IAsset[] => {
  if (networkPassphrase === Networks.PUBLIC) {
    return [MAINNET_USDC, MAINNET_EURC];
  }

  if (networkPassphrase === Networks.TESTNET) {
    return [TESTNET_USDC];
  }

  return [];
};
