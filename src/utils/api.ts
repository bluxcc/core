import { IUser } from '../store';
import { BluxAccessDeniedError } from './errors';
import { bufferToBase64Url, fetcher } from './helpers';
import { AuthenticateApiResponse } from '../types';
import { BLUX_API, BLUX_APP_ID_HEADER } from '../constants/consts';
import { PasskeyFlowResult } from '../pages/Onboarding/Passkey';

type ApiErrorResponse = {
  status: 400 | 401 | 403 | 404 | 429 | 500;
  error: string;
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
      };
    }

    return {
      isValid: false,
      message: 'Unexpected response from api.',
      terms: '',
      privacyPolicy: '',
      socials: [],
      socialsConfig: [],
    };
  } catch (e: any) {
    return {
      isValid: false,
      message: 'Unexpected response from api. ' + e.message,
      terms: '',
      privacyPolicy: '',
      socials: [],
      socialsConfig: [],
    };
  }
};

export const apiRegisterPasskeyChallenge = async (
  appId: string,
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
        auth_value: '',
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

export const apiRegisterPasskey = async (
  appId: string,
  challenge: ApiPasskeyChallenge,
  passkeyResult: PasskeyFlowResult,
): Promise<string> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  const { credential } = passkeyResult;

  // The /auth/code handler unmarshals `code` into a flat map and reads
  // top-level snake_case keys: for registration challenge_id +
  // attestation_object + client_data_json + transports; for login challenge_id
  // + authenticator_data + client_data_json + signature. A registration
  // (create()) gives an AuthenticatorAttestationResponse, a login (get()) an
  // AuthenticatorAssertionResponse — they share no response fields, so build
  // the right flat shape per step.
  let codeObject: Record<string, unknown>;

  if (passkeyResult.step === 'register') {
    const attestation = credential.response as AuthenticatorAttestationResponse;

    codeObject = {
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

    codeObject = {
      challenge_id: challenge.challenge_id,
      authenticator_data: bufferToBase64Url(assertion.authenticatorData),
      client_data_json: bufferToBase64Url(assertion.clientDataJSON),
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
      // Already a RawURL-base64 string; the server matches it against the
      // credential id derived from the attestation.
      auth_value: credential.id,
      code: JSON.stringify(codeObject),
    }),
  });

  if (res.status === 400) {
    throw new Error('BLUX: invalid inputs');
  }

  if (res.status === 403) {
    throw new Error(
      'BLUX: This account already has a passkey; sign in with the existing one.',
    );
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
        auth_method: 'email',
        auth_value: authValue,
      }),
    });
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }

  // The project restricts access (allowlist/blocklist) and this email is blocked.
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
    return true;
  }

  throw new Error('BLUX: Unexpected response from api');
};

export const apiStoreWalletConnection = async (
  appId: string,
  walletName: string,
  walletAddress: string,
): Promise<boolean> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  if (!walletAddress) {
    throw new Error('BLUX: wallet address is missing.');
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
        wallet: walletAddress,
        auth_method: 'wallet',
        auth_value: walletName,
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
    return true;
  }

  throw new Error('BLUX: Unexpected response from api');
};

export const apiVerifyOtp = async (appId: string, user: IUser, otp: string) => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  try {
    const res = await fetcher<ApiResponse<string>>(`${BLUX_API}/auth/code`, {
      method: 'POST',
      headers: {
        [BLUX_APP_ID_HEADER]: appId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: otp,
        wallet: '',
        auth_method: 'email',
        auth_value: user.authValue,
      }),
    });

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
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
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
