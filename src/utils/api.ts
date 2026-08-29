import { IUser } from '../store';
import { BluxAccessDeniedError } from './errors';
import { bufferToBase64Url, fetcher } from './helpers';
import { AuthenticateApiResponse, WalletProofType } from '../types';
import { BLUX_API, BLUX_APP_ID_HEADER } from '../constants/consts';
import { PasskeyFlowResult } from '../pages/Onboarding/Passkey';

type ApiErrorResponse = {
  status: 400 | 401 | 403 | 404 | 409 | 429 | 500 | 502 | 503;
  error: string;
  code?: string;
};

type ApiSuccessResponse<T> = {
  status: 200;
  message: string;
  result: T;
};

type ApiResponse<T> = ApiErrorResponse | ApiSuccessResponse<T>;

type ApiSocialConfigEntry = {
  provider: string;
  display_name?: string;
};

type ApiResponseAuth = {
  privacy_policy: string;
  terms: string;
  socials?: string[];
  socials_config?: ApiSocialConfigEntry[];
  plan?: string;
  sms_enabled?: boolean;
};

type ApiPasskeyChallenge = {
  user_id: string;
  challenge: string;
  challenge_id: number;
};

// todo: double check
export const authenticateAppId = async (
  appId: string,
): Promise<AuthenticateApiResponse> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  try {
    const res = await fetcher<ApiResponse<ApiResponseAuth>>(
      `${BLUX_API}/auth/validate`,
      {
        method: 'POST',
        headers: {
          [BLUX_APP_ID_HEADER]: appId,
        },
      },
    );

    if (res.status === 200) {
      return {
        isValid: true,
        message: res.message,
        terms: res.result.terms,
        privacyPolicy: res.result.privacy_policy,
        socials: (res.result.socials ?? []).map((s) => s.toLowerCase()),
        socialsConfig: (res.result.socials_config ?? []).map((entry) => ({
          provider: (entry.provider || '').toLowerCase(),
          displayName: entry.display_name || entry.provider || '',
        })),
        plan: res.result.plan || 'free',
        smsEnabled: !!res.result.sms_enabled,
      };
    }

    if (res.status === 404) {
      return {
        isValid: false,
        message: res.error,
        terms: '',
        privacyPolicy: '',
        socials: [],
        socialsConfig: [],
        plan: '',
        smsEnabled: false,
      };
    }

    return {
      isValid: false,
      message: 'Unexpected response from api.',
      terms: '',
      privacyPolicy: '',
      socials: [],
      socialsConfig: [],
      plan: '',
      smsEnabled: false,
    };
  } catch (e: any) {
    return {
      isValid: false,
      message: 'Unexpected response from api. ' + e.message,
      terms: '',
      privacyPolicy: '',
      socials: [],
      socialsConfig: [],
      plan: '',
      smsEnabled: false,
    };
  }
};

// Requests a WebAuthn challenge. The server binds the challenge to the user row
// identified by `authValue`, so pass the stored credential id when logging an
// existing passkey in, or a fresh unique handle when registering a new one.
// Sending an empty/constant value would bind every passkey user to one row.
export const apiPasskeyChallenge = async (
  appId: string,
  authValue: string,
): Promise<ApiPasskeyChallenge> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  const res = await fetcher<ApiResponse<ApiPasskeyChallenge>>(
    `${BLUX_API}/auth`,
    {
      method: 'POST',
      headers: {
        [BLUX_APP_ID_HEADER]: appId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: '',
        auth_method: 'passkey',
        auth_value: authValue,
      }),
    },
  );

  if (res.status === 400) {
    throw new Error('BLUX: invalid inputs');
  }

  if (res.status === 500) {
    throw new Error('BLUX: server error');
  }

  if (res.status === 429) {
    throw new Error('BLUX: too many requests');
  }

  if (res.status === 200) {
    return res.result;
  }

  throw new Error('BLUX: Unexpected response from api');
};

export const apiPasskeyVerify = async (
  appId: string,
  challenge: ApiPasskeyChallenge,
  passkeyResult: PasskeyFlowResult,
): Promise<string> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  const { credential } = passkeyResult;

  // The server parses `code` as a flat object (json.Unmarshal into a map for
  // registration, into AssertionResponse for login) and reads snake_case fields
  // off the top level — NOT a nested WebAuthn `{ response: { ... } }` envelope.
  // Registration needs attestation_object + client_data_json + transports; login
  // needs client_data_json + authenticator_data + signature. Both carry the
  // challenge_id so the server can locate the single-use challenge.
  let code: Record<string, unknown>;

  if (passkeyResult.step === 'register') {
    const attestation = credential.response as AuthenticatorAttestationResponse;

    code = {
      challenge_id: challenge.challenge_id,
      attestation_object: bufferToBase64Url(attestation.attestationObject),
      client_data_json: bufferToBase64Url(attestation.clientDataJSON),
      transports:
        typeof attestation.getTransports === 'function'
          ? attestation.getTransports()
          : [],
    };
  } else {
    const assertion = credential.response as AuthenticatorAssertionResponse;

    code = {
      challenge_id: challenge.challenge_id,
      client_data_json: bufferToBase64Url(assertion.clientDataJSON),
      authenticator_data: bufferToBase64Url(assertion.authenticatorData),
      signature: bufferToBase64Url(assertion.signature),
    };
  }

  const res = await fetcher<ApiResponse<string>>(`${BLUX_API}/auth/code`, {
    method: 'POST',
    headers: {
      [BLUX_APP_ID_HEADER]: appId,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_method: 'passkey',
      // PublicKeyCredential.id is already RawURL-base64; the server matches it
      // against the credential id derived from the attestation (register) or the
      // stored credential (login).
      auth_value: credential.id,
      code: JSON.stringify(code),
    }),
  });

  if (res.status === 400) {
    throw new Error('BLUX: invalid inputs');
  }

  if (res.status === 401) {
    throw new Error('BLUX: passkey verification failed');
  }

  if (res.status === 403) {
    throw new Error(
      'BLUX: This account already has a passkey; sign in with the existing one.',
    );
  }

  if (res.status === 404) {
    throw new Error('BLUX: user not found');
  }

  if (res.status === 500) {
    throw new Error('BLUX: server error');
  }

  if (res.status === 429) {
    throw new Error('BLUX: too many requests');
  }

  if (res.status === 200) {
    return res.result;
  }

  throw new Error('BLUX: Unexpected response from api');
};

export const apiSendOtp = async (
  appId: string,
  authValue: string,
  authMethod: 'email' | 'sms' = 'email',
): Promise<boolean> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  let res: ApiResponse<null>;

  try {
    res = await fetcher<ApiResponse<null>>(`${BLUX_API}/auth`, {
      method: 'POST',
      headers: {
        [BLUX_APP_ID_HEADER]: appId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: '',
        auth_method: authMethod,
        auth_value: authValue,
      }),
    });
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }

  // SMS on a free plan, or the project restricts access and this identity is
  // blocked.
  if (res.status === 403) {
    throw new BluxAccessDeniedError(res.error);
  }

  if (res.status === 400) {
    throw new Error('BLUX: invalid inputs');
  }

  if (res.status === 500) {
    throw new Error('BLUX: server error');
  }

  if (res.status === 503) {
    throw new Error('BLUX: SMS is not configured');
  }

  if (res.status === 429) {
    throw new Error('BLUX: too many requests');
  }

  if (res.status === 200) {
    return true;
  }

  throw new Error('BLUX: Unexpected response from api');
};

type ApiWalletChallenge = {
  challenge_xdr?: string;
  challenge?: string;
  network_passphrase: string;
  proof_type?: WalletProofType;
};

// Step 1 of wallet login: ask the API for an ownership challenge the connected
// wallet must sign to prove it controls `walletAddress`. Default is a SEP-10
// challenge transaction (sequence 0, ManageData only — never submittable).
// Wallets that treat that TX as a real payment pass proofType `signed_message`
// and receive a SEP-53 challenge string instead. The project's allow/block
// list is enforced here (403 -> BluxAccessDeniedError).
export const apiWalletChallenge = async (
  appId: string,
  walletName: string,
  walletAddress: string,
  proofType: WalletProofType = 'signed_transaction',
): Promise<ApiWalletChallenge> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  if (!walletAddress) {
    throw new Error('BLUX: wallet address is missing.');
  }

  let res: ApiResponse<ApiWalletChallenge>;

  try {
    res = await fetcher<ApiResponse<ApiWalletChallenge>>(`${BLUX_API}/auth`, {
      method: 'POST',
      headers: {
        [BLUX_APP_ID_HEADER]: appId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: walletAddress,
        auth_method: 'wallet',
        auth_value: walletName,
        proof_type: proofType,
      }),
    });
  } catch (_e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }

  // The project restricts access (allowlist/blocklist) and this address is
  // blocked.
  if (res.status === 403) {
    throw new BluxAccessDeniedError(res.error);
  }

  if (res.status === 400) {
    throw new Error('BLUX: invalid inputs');
  }

  if (res.status === 500) {
    throw new Error('BLUX: server error');
  }

  if (res.status === 429) {
    throw new Error('BLUX: too many requests');
  }

  if (res.status === 200) {
    return res.result;
  }

  throw new Error('BLUX: Unexpected response from api');
};

// Step 3 of wallet login: submit the signed ownership proof. For the default
// SEP-10 path, `code` is the signed challenge XDR (passed through untouched so
// the transaction hash still matches). For `signed_message`, `code` is the
// SEP-53 signature and `challenge` is the string that was signed. The server
// locates the single-use challenge by hash and checks the signature against
// the wallet address, then returns a session JWT.
export const apiVerifyWalletChallenge = async (
  appId: string,
  code: string,
  options?: {
    proofType?: WalletProofType;
    challenge?: string;
  },
): Promise<string> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  let res: ApiResponse<string>;

  try {
    res = await fetcher<ApiResponse<string>>(`${BLUX_API}/auth/code`, {
      method: 'POST',
      headers: {
        [BLUX_APP_ID_HEADER]: appId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_method: 'wallet',
        code,
        ...(options?.proofType ? { proof_type: options.proofType } : {}),
        ...(options?.challenge ? { challenge: options.challenge } : {}),
      }),
    });
  } catch (_e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }

  if (res.status === 403) {
    throw new BluxAccessDeniedError(res.error);
  }

  if (res.status === 401) {
    throw new Error('BLUX: Challenge verification failed');
  }

  // 400 covers an invalid / expired / already-used challenge — restart from the
  // challenge request (apiWalletChallenge).
  if (res.status === 400) {
    throw new Error('BLUX: Login challenge expired. Please try again.');
  }

  if (res.status === 404) {
    throw new Error('BLUX: user not found');
  }

  if (res.status === 500) {
    throw new Error('BLUX: server error');
  }

  if (res.status === 429) {
    throw new Error('BLUX: too many requests');
  }

  if (res.status === 200) {
    return res.result;
  }

  throw new Error('BLUX: Unexpected response from api');
};

export const apiVerifyOtp = async (appId: string, user: IUser, otp: string) => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  let res: ApiResponse<string>;

  try {
    res = await fetcher<ApiResponse<string>>(`${BLUX_API}/auth/code`, {
      method: 'POST',
      headers: {
        [BLUX_APP_ID_HEADER]: appId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: otp,
        wallet: '',
        auth_method:
          user.authMethod === 'sms' || user.authMethod === 'phone'
            ? 'sms'
            : 'email',
        auth_value: user.authValue,
      }),
    });
  } catch (_e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }

  if (res.status === 403) {
    throw new BluxAccessDeniedError(res.error);
  }

  if (res.status === 400) {
    throw new Error('BLUX: invalid inputs');
  }

  if (res.status === 500) {
    throw new Error('BLUX: server error');
  }

  if (res.status === 404) {
    throw new Error('BLUX: invalid code');
  }

  if (res.status === 429) {
    throw new Error('BLUX: too many requests');
  }

  if (res.status === 200) {
    return res.result;
  }

  throw new Error('BLUX: Unexpected response from api');
};

type ApiGetUserResponse = {
  auth_method: string;
  auth_value: string;
  public_key: string;
};

export const apiGetUser = async (JWT: string) => {
  const res = await fetcher<ApiResponse<ApiGetUserResponse>>(
    `${BLUX_API}/users`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${JWT}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (res.status === 401) {
    throw new Error('BLUX: invalid JWT');
  }

  if (res.status === 500) {
    throw new Error('BLUX: server error');
  }

  if (res.status === 404) {
    throw new Error('BLUX: user nout found');
  }

  if (res.status === 429) {
    throw new Error('BLUX: too many requests');
  }

  if (res.status === 200) {
    return res.result;
  }

  throw new Error('BLUX: Unexpected response from api');
};

type ApiSignMessageResponse = string;
type ApiSignTransactionResponse = string;
type ApiSignAuthEntryResponse = string;

export const apiSignMessage = async (JWT: string, message: string) => {
  try {
    const res = await fetcher<ApiResponse<ApiSignMessageResponse>>(
      `${BLUX_API}/users/sign-message`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${JWT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
        }),
      },
    );

    if (res.status === 401) {
      throw new Error('BLUX: invalid JWT');
    }

    if (res.status === 500) {
      throw new Error('BLUX: server error');
    }

    if (res.status === 404) {
      throw new Error('BLUX: user nout found');
    }

    if (res.status === 429) {
      throw new Error('BLUX: too many requests');
    }

    if (res.status === 200 && res.result) {
      return res.result;
    }

    throw new Error('BLUX: Unexpected response from api');
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
};

export const apiSignTransaction = async (
  JWT: string,
  xdr: string,
  network: string,
) => {
  try {
    const res = await fetcher<ApiResponse<ApiSignTransactionResponse>>(
      `${BLUX_API}/users/sign-transaction`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${JWT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xdr,
          network,
        }),
      },
    );

    if (res.status === 401) {
      throw new Error('BLUX: invalid JWT');
    }

    if (res.status === 500) {
      throw new Error('BLUX: server error');
    }

    if (res.status === 404) {
      throw new Error('BLUX: user nout found');
    }

    if (res.status === 429) {
      throw new Error('BLUX: too many requests');
    }

    if (res.status === 200 && res.result) {
      return res.result;
    }

    throw new Error('BLUX: Unexpected response from api');
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
};

// POST /users/sign-auth-entry — signs a Soroban authorization entry with the
// user's API-managed key (email/social/passkey sessions).
export const apiSignAuthEntry = async (
  JWT: string,
  authEntry: string,
  network: string,
) => {
  try {
    const res = await fetcher<ApiResponse<ApiSignAuthEntryResponse>>(
      `${BLUX_API}/users/sign-auth-entry`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${JWT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_entry: authEntry,
          network,
        }),
      },
    );

    if (res.status === 401) {
      throw new Error('BLUX: invalid JWT');
    }

    if (res.status === 500) {
      throw new Error('BLUX: server error');
    }

    if (res.status === 404) {
      throw new Error('BLUX: user nout found');
    }

    if (res.status === 429) {
      throw new Error('BLUX: too many requests');
    }

    if (res.status === 200 && res.result) {
      return res.result;
    }

    throw new Error('BLUX: Unexpected response from api');
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
};

// ==================== Custom tokens (SAC) ====================

/** Mirrors the API's `TokenView`. The API only buckets tokens mainnet/testnet. */
export type ApiTokenView = {
  id: number;
  contract_address: string;
  network: string;
  name: string;
  symbol: string;
  decimals: number;
};

/** GET /tokens result: the user's tokens grouped per network bucket. */
export type ApiGroupedTokens = {
  mainnet: ApiTokenView[];
  testnet: ApiTokenView[];
};

const authHeaders = (JWT: string) => ({
  Accept: 'application/json',
  Authorization: `Bearer ${JWT}`,
  'Content-Type': 'application/json',
});

// GET /tokens — the authenticated user's preferred tokens, grouped per network.
export const apiGetTokens = async (JWT: string): Promise<ApiGroupedTokens> => {
  const res = await fetcher<ApiResponse<ApiGroupedTokens>>(
    `${BLUX_API}/tokens`,
    {
      method: 'GET',
      headers: authHeaders(JWT),
    },
  );

  if (res.status === 401) {
    throw new Error('BLUX: invalid JWT');
  }

  if (res.status === 500) {
    throw new Error('BLUX: server error');
  }

  if (res.status === 200) {
    return {
      mainnet: res.result?.mainnet ?? [],
      testnet: res.result?.testnet ?? [],
    };
  }

  throw new Error('BLUX: Unexpected response from api');
};

// POST /tokens — the server validates the SAC on-chain, captures its
// name/symbol/decimals, stores it, and links it to the user. `network` is the
// API bucket ('mainnet' | 'testnet').
export const apiAddToken = async (
  JWT: string,
  contractAddress: string,
  network: 'mainnet' | 'testnet',
): Promise<ApiTokenView> => {
  const res = await fetcher<ApiResponse<ApiTokenView>>(`${BLUX_API}/tokens`, {
    method: 'POST',
    headers: authHeaders(JWT),
    body: JSON.stringify({
      contract_address: contractAddress,
      network,
    }),
  });

  if (res.status === 401) {
    throw new Error('BLUX: invalid JWT');
  }

  if (res.status === 409) {
    throw new Error('BLUX: token already added');
  }

  if (res.status === 502) {
    throw new Error('BLUX: could not reach the network to validate the token');
  }

  if (res.status === 400) {
    throw new Error(res.error || 'BLUX: invalid token, or token limit reached');
  }

  if (res.status === 200 && res.result) {
    return res.result;
  }

  throw new Error('BLUX: Unexpected response from api');
};

// DELETE /tokens/{id} — unlink a token from the authenticated user.
export const apiDeleteToken = async (
  JWT: string,
  tokenId: number,
): Promise<boolean> => {
  const res = await fetcher<ApiResponse<null>>(
    `${BLUX_API}/tokens/${tokenId}`,
    {
      method: 'DELETE',
      headers: authHeaders(JWT),
    },
  );

  if (res.status === 401) {
    throw new Error('BLUX: invalid JWT');
  }

  if (res.status === 404) {
    throw new Error('BLUX: token not in your list');
  }

  if (res.status === 400) {
    throw new Error('BLUX: invalid token id');
  }

  if (res.status === 200) {
    return true;
  }

  throw new Error('BLUX: Unexpected response from api');
};
