import { IUser } from '../store';
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
  client_id?: string;
  redirect_uri?: string;
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
          clientId: entry.client_id || '',
          redirectUri: entry.redirect_uri || '',
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

export const apiSocialLogin = async (
  appId: string,
  provider: string,
  code: string,
): Promise<string> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  let res: ApiResponse<string>;

  try {
    res = await fetcher<ApiResponse<string>>(`${BLUX_API}/auth/social`, {
      method: 'POST',
      headers: {
        [BLUX_APP_ID_HEADER]: appId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        code,
      }),
    });
  } catch (_e: any) {
    throw new Error('BLUX: Could not reach the Blux API.');
  }

  if (res.status === 200 && res.result) {
    return res.result;
  }

  // Surface the backend message (e.g. provider not enabled, account not
  // allowed by the restriction list) instead of a generic error.
  throw new Error(
    'BLUX: ' + ((res as ApiErrorResponse).error || 'Unexpected response from api'),
  );
};

export const apiRegisterPasskeyChallenge = async (
  appId: string,
): Promise<ApiPasskeyChallenge> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  try {
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
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
};

export const apiRegisterPasskey = async (
  appId: string,
  challenge: ApiPasskeyChallenge,
  passkeyResult: PasskeyFlowResult,
): Promise<string> => {
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
        auth_method: 'passkey',
        auth_value: passkeyResult.credential.id,
        code: JSON.stringify({
          challenge_id: challenge.challenge_id,
          id: passkeyResult.credential.id,
          rawId: bufferToBase64Url(passkeyResult.credential.rawId),
          type: passkeyResult.credential.type,
          response: {
            authenticatorData: bufferToBase64Url(
              // @ts-ignore
              passkeyResult.credential.response.authenticatorData,
            ),
            clientDataJSON: bufferToBase64Url(
              passkeyResult.credential.response.clientDataJSON,
            ),
            signature: bufferToBase64Url(
              // @ts-ignore
              passkeyResult.credential.response.signature,
            ),
            // @ts-ignore
            userHandle: passkeyResult.credential.response.userHandle
              ? bufferToBase64Url(
                // @ts-ignore
                passkeyResult.credential.response.userHandle,
              )
              : null,
          },
        }),
      }),
    });

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
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
};

export const apiSendOtp = async (
  appId: string,
  authValue: string,
): Promise<boolean> => {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  try {
    const res = await fetcher<ApiResponse<null>>(`${BLUX_API}/auth`, {
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
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
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

  try {
    const res = await fetcher<ApiResponse<null>>(`${BLUX_API}/auth`, {
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
  } catch (_e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
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
  try {
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
  } catch (e: any) {
    throw new Error('BLUX: Unexpected response from api');
  }
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
