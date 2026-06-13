import { useEffect, useRef, useState } from 'react';

import { Route } from '../../../enums';
import Button from '../../../components/Button';
import { useLang } from '../../../hooks/useLang';
import Divider from '../../../components/Divider';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import { BLUX_JWT_STORE } from '../../../constants/consts';
import { getState, setState, useAppStore } from '../../../store';
import { apiGetUser, apiSocialLogin } from '../../../utils/api';
import { setRecentLoginConfig } from '../../../utils/checkRecentLogins';
import { capitalizeFirstLetter } from '../../../utils/helpers';
import continueLoginProcess from '../../../stellar/processes/continueLoginProcess';
import {
  ISocialSession,
  SOCIAL_PROVIDERS,
  beginSocialLogin,
  awaitSocialAuthCode,
  getActiveSocialSession,
  cancelActiveSocialSession,
} from '../../../utils/socialLogin';

type SocialStatus = 'loading' | 'failed' | 'success';

const SUCCESS_COLOR = '#12B76A';
const FAILED_COLOR = '#D92D20';

const SocialsOnboarding = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const [status, setStatus] = useState<SocialStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const isRunning = useRef(false);

  const appearance = store.config.appearance;
  const provider = store.user?.authMethod || '';
  const providerMeta = SOCIAL_PROVIDERS[provider];
  const displayName =
    providerMeta?.displayName || capitalizeFirstLetter(provider || 'social');

  const runSocialFlow = async (existingSession?: ISocialSession | null) => {
    if (isRunning.current) {
      return;
    }

    isRunning.current = true;

    setStatus('loading');
    setErrorMessage('');

    try {
      let session = existingSession ?? getActiveSocialSession();

      if (!session || session.provider !== provider) {
        // Retry path: this runs synchronously inside the Retry click, so the
        // popup is allowed to open.
        session = beginSocialLogin(
          provider,
          store.apiResponse?.socialsConfig || [],
        );
      }

      const code = await awaitSocialAuthCode(session);

      const jwt = await apiSocialLogin(store.config.appId, provider, code);

      localStorage.setItem(BLUX_JWT_STORE, jwt);

      store.setAuth({
        isAuthenticated: true,
        JWT: jwt,
      });

      const result = await apiGetUser(jwt);

      setState((state) => ({
        ...state,
        user: {
          address: result.public_key,
          walletPassphrase: '',
          authMethod: provider,
          authValue: result.auth_value,
        },
      }));

      setRecentLoginConfig(provider, result.auth_value || '', Date.now(), jwt);

      store.connectWalletSuccessful(
        result.public_key,
        store.stellar?.activeNetwork || '',
      );

      setStatus('success');

      setTimeout(() => {
        if (!getState().modal.isOpen) {
          return;
        }

        continueLoginProcess();
      }, 1200);
    } catch (cause: any) {
      cancelActiveSocialSession();

      setStatus('failed');
      // Errors carry the BLUX: prefix for developers; keep the modal clean.
      setErrorMessage(
        (cause?.message || '').replace(/^BLUX:\s*/, '') ||
          t('loginRetryMessage'),
      );
    } finally {
      isRunning.current = false;
    }
  };

  useEffect(() => {
    // The popup was already opened by the click on the onboarding page; here
    // we only wait for its result.
    runSocialFlow();

    return () => {
      cancelActiveSocialSession();
    };
  }, []);

  const handleRetry = () => {
    runSocialFlow(
      beginSocialLogin(provider, store.apiResponse?.socialsConfig || []),
    );
  };

  const handleBack = () => {
    cancelActiveSocialSession();

    store.setRoute(Route.ONBOARDING);
  };

  const ringColor =
    status === 'success'
      ? SUCCESS_COLOR
      : status === 'failed'
        ? FAILED_COLOR
        : appearance.borderColor;

  return (
    <div className="bluxcc:mt-3 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div
        className="bluxcc:mb-6 bluxcc:flex bluxcc:size-20 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full bluxcc:transition-colors bluxcc:duration-300"
        style={{
          borderColor: ringColor,
          borderWidth: appearance.borderWidth,
          borderStyle: 'solid',
        }}
      >
        {providerMeta ? (
          <CDNImage name={providerMeta.icon} />
        ) : (
          <CDNImage
            name={CDNFiles.Globe}
            props={{ fill: appearance.textColor }}
          />
        )}
      </div>

      <div className="bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl" style={{ color: appearance.textColor }}>
          {status === 'loading' &&
            t('waitingFor', { walletName: displayName })}
          {status === 'success' && t('connectionSuccessfulTitle')}
          {status === 'failed' && t('loginFailed')}
        </p>

        <p
          className="bluxcc:min-h-10 bluxcc:text-sm"
          style={{
            color: status === 'failed' ? FAILED_COLOR : appearance.textColor,
          }}
        >
          {status === 'loading' &&
            t('socialPopupHelp', { provider: displayName })}
          {status === 'success' && t('connectionSuccessfulMessage')}
          {status === 'failed' && (errorMessage || t('loginRetryMessage'))}
        </p>
      </div>

      <Divider />

      {status === 'loading' && (
        <Button
          state="disabled"
          variant="outline"
          startIcon={
            <CDNImage
              className="bluxcc:animate-spin"
              name={CDNFiles.Loading}
              props={{ fill: appearance.accentColor }}
            />
          }
        >
          {t('connecting')}
        </Button>
      )}

      {status === 'success' && (
        <Button state="disabled" variant="outline">
          {t('loggingIn')}
        </Button>
      )}

      {status === 'failed' && (
        <div className="bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:gap-2">
          <Button state="enabled" variant="fill" onClick={handleRetry}>
            {t('tryAgain')}
          </Button>

          <Button
            size="medium"
            state="enabled"
            variant="text"
            onClick={handleBack}
            style={{
              color: appearance.accentColor,
            }}
          >
            {t('back')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SocialsOnboarding;
