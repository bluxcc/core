import { fetcher } from './helpers';
import { AuthenticateApiResponse } from '../types';
import { BLUX_API, BLUX_APP_ID_HEADER } from '../constants/consts';
import { IUser } from '../store';

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

export const authenticateAppId = async (
  appId: string,
): Promise<AuthenticateApiResponse> => {
  if (!appId) {
    throw new Error('appId is missing in config.');
  }

  try {
    const res = await fetcher<ApiResponse<null>>(`${BLUX_API}/auth/validate`, {
      method: 'POST',
      headers: {
        [BLUX_APP_ID_HEADER]: appId,
      },
    });

    if (res.status === 200) {
      return { isValid: true, message: res.message };
    }

    if (res.status === 404) {
      return { isValid: false, message: res.error };
    }

    return {
      isValid: false,
      message: 'Unexpected response from api.',
    };
  } catch (e: any) {
    return {
      isValid: false,
      message: 'Unexpected response from api. ' + e.message,
    };
  }
};

export const apiSendOtp = async (
  appId: string,
  authValue: string,
): Promise<boolean> => {
  if (!appId) {
    throw new Error('appId is missing in config.');
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
      throw new Error('invalid inputs');
    }

    if (res.status === 500) {
      throw new Error('server error');
    }

    if (res.status === 429) {
      throw new Error('too many requests');
    }

    if (res.status === 200) {
      return true;
    }

    throw new Error('Unexpected response from api');
  } catch (e: any) {
    throw new Error('Unexpected response from api');
  }
};

export const apiVerifyOtp = async (appId: string, user: IUser, otp: string) => {
  if (!appId) {
    throw new Error('appId is missing in config.');
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
      throw new Error('invalid inputs');
    }

    if (res.status === 500) {
      throw new Error('server error');
    }

    if (res.status === 404) {
      throw new Error('invalid code');
    }

    if (res.status === 429) {
      throw new Error('too many requests');
    }

    if (res.status === 200) {
      return res.result;
    }

    throw new Error('Unexpected response from api');
  } catch (e: any) {
    throw new Error('Unexpected response from api');
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
      throw new Error('invalid JWT');
    }

    if (res.status === 500) {
      throw new Error('server error');
    }

    if (res.status === 404) {
      throw new Error('user nout found');
    }

    if (res.status === 429) {
      throw new Error('too many requests');
    }

    if (res.status === 200) {
      return res.result;
    }

    throw new Error('Unexpected response from api');
  } catch (e: any) {
    throw new Error('Unexpected response from api');
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
      throw new Error('invalid JWT');
    }

    if (res.status === 500) {
      throw new Error('server error');
    }

    if (res.status === 404) {
      throw new Error('user nout found');
    }

    if (res.status === 429) {
      throw new Error('too many requests');
    }

    if (res.status === 200 && res.result) {
      return res.result;
    }

    throw new Error('Unexpected response from api');
  } catch (e: any) {
    throw new Error('Unexpected response from api');
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
      throw new Error('invalid JWT');
    }

    if (res.status === 500) {
      throw new Error('server error');
    }

    if (res.status === 404) {
      throw new Error('user nout found');
    }

    if (res.status === 429) {
      throw new Error('too many requests');
    }

    if (res.status === 200 && res.result) {
      return res.result;
    }

    throw new Error('Unexpected response from api');
  } catch (e: any) {
    throw new Error('Unexpected response from api');
  }
};
