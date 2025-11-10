import { fetcher } from './helpers';
import { BLUX_API, BLUX_APP_ID_HEADER } from '../constants/consts';

type AppIdNotFound = {
  status: 404;
  error: string;
};

type AppIdIsValid = {
  status: 200;
  message: string;
};

type AuthenticateAppIdResponse = AppIdNotFound | AppIdIsValid;

export const authenticateAppId = async (appId: string) => {
  if (!appId) {
    throw new Error('appId is missing in config.');
  }

  try {
    const res = await fetcher<AuthenticateAppIdResponse>(
      `${BLUX_API}/auth/validate`,
      {
        method: 'POST',
        headers: {
          [BLUX_APP_ID_HEADER]: appId,
        },
      },
    );

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

  // setApi({
  //   isAuthenticated: res.status === 200,
  //   error: errorMessage,
  // });
};
