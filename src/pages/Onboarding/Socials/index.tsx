import { useEffect, useRef, useState } from 'react';

import { Route } from '../../../enums';
import Button from '../../../components/Button';
import { useLang } from '../../../hooks/useLang';
import Divider from '../../../components/Divider';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import SocialProviderIcon from '../../../components/SocialProviderIcon';
import { getState, useAppStore } from '../../../store';
import { apiTelegramLogin } from '../../../utils/api';
import { getContrastColor } from '../../../utils/helpers';
import { isAccessDenied, looksLikeAccessDenied } from '../../../utils/errors';
import continueLoginProcess from '../../../stellar/processes/continueLoginProcess';
import { hydrateUserFromJwt } from '../../../stellar/processes/hydrateUserFromJwt';
import {
  ISocialSession,
  beginSocialLogin,
  awaitSocialLogin,
  getActiveSocialSession,
  cancelActiveSocialSession,
  getEnabledSocials,
  getSocialDisplayName,
  isTelegramLogin,
  telegramBotUsername,
  telegramMiniAppsEnabled,
  telegramWebAppInitData,
} from '../../../utils/socialLogin';
import TelegramWidget from './TelegramWidget';

type SocialStatus = 'loading' | 'failed' | 'success';

const SUCCESS_COLOR = '#12B76A';
const FAILED_COLOR = '#D92D20';

const SocialsOnboarding = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const [status, setStatus] = useState<SocialStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDenied, setIsDenied] = useState(false);
  const [widgetKey, setWidgetKey] = useState(0);
  const isRunning = useRef(false);

  const appearance = store.config.appearance;
  const provider = store.user?.authMethod || '';
  const displayName = getSocialDisplayName(provider || 'social');
  const telegram = isTelegramLogin(provider, store.apiResponse);
  const botUsername = telegramBotUsername(store.apiResponse);
  const miniAppInitData =
    telegram && telegramMiniAppsEnabled(store.apiResponse)
      ? telegramWebAppInitData()
      : '';

  const finishWithJwt = async (jwt: string) => {
    await hydrateUserFromJwt(jwt, provider);

    setStatus('success');

    setTimeout(() => {
      if (!getState().modal.isOpen) {
        return;
      }

      continueLoginProcess();
    }, 1200);
  };

  const fail = (cause: unknown) => {
    cancelActiveSocialSession();

    const raw = cause instanceof Error ? cause.message : '';
    const message = raw.replace(/^BLUX:\s*/, '');
    const denied = isAccessDenied(cause) || looksLikeAccessDenied(message);

    setStatus('failed');
    setIsDenied(denied);
    setErrorMessage(message || t('loginRetryMessage'));
  };

  const runSocialFlow = async (existingSession?: ISocialSession | null) => {
    if (telegram) {
      return;
    }

    if (isRunning.current) {
      return;
    }

    isRunning.current = true;

    setStatus('loading');
    setErrorMessage('');
    setIsDenied(false);

    try {
      let session = existingSession ?? getActiveSocialSession();

      if (!session || session.provider !== provider) {
        // Retry path: this runs synchronously inside the Retry click, so the
        // popup is allowed to open.
        session = beginSocialLogin(provider, store.config.appId);
      }

      const jwt = await awaitSocialLogin(session);
      await finishWithJwt(jwt);
    } catch (cause: unknown) {
      fail(cause);
    } finally {
      isRunning.current = false;
    }
  };

  useEffect(() => {
    if (telegram) {
      if (miniAppInitData) {
        return;
      }

      if (!botUsername) {
        fail(new Error('BLUX: Telegram is not configured for this app.'));
      }

      return;
    }

    runSocialFlow();

    return () => {
      cancelActiveSocialSession();
    };
  }, []);

  const handleTelegramAuth = async (user: Record<string, unknown>) => {
    if (isRunning.current) {
      return;
    }

    isRunning.current = true;
    setStatus('loading');
    setErrorMessage('');
    setIsDenied(false);

    try {
      const jwt = await apiTelegramLogin(store.config.appId, user);
      await finishWithJwt(jwt);
    } catch (cause: unknown) {
      fail(cause);
    } finally {
      isRunning.current = false;
    }
  };

  useEffect(() => {
    if (!miniAppInitData) {
      return;
    }

    handleTelegramAuth({ init_data: miniAppInitData });
  }, []);

  const handleRetry = () => {
    setStatus('loading');
    setErrorMessage('');
    setIsDenied(false);

    if (telegram) {
      if (miniAppInitData) {
        handleTelegramAuth({ init_data: miniAppInitData });
        return;
      }

      if (!botUsername) {
        fail(new Error('BLUX: Telegram is not configured for this app.'));
        return;
      }

      setWidgetKey((k) => k + 1);
      return;
    }

    runSocialFlow(beginSocialLogin(provider, store.config.appId));
  };

  const handleBack = () => {
    cancelActiveSocialSession();

    const enabled = getEnabledSocials(
      store.config.loginMethods || [],
      store.apiResponse,
    );
    const cameFromOtherSocials = enabled.length > 1 && enabled[0] !== provider;

    store.setRoute(
      cameFromOtherSocials ? Route.OTHER_SOCIALS : Route.ONBOARDING,
    );
  };

  const ringColor =
    status === 'success'
      ? SUCCESS_COLOR
      : status === 'failed'
        ? FAILED_COLOR
        : appearance.borderColor;

  const waitingHelp = telegram
    ? t('telegramWidgetHelp')
    : t('socialPopupHelp', { provider: displayName });

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
        {provider ? (
          <SocialProviderIcon
            provider={provider}
            fill={getContrastColor(appearance.background)}
          />
        ) : (
          <CDNImage
            name={CDNFiles.Globe}
            props={{ fill: appearance.textColor }}
          />
        )}
      </div>

      <div className="bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl" style={{ color: appearance.textColor }}>
          {status === 'loading' && t('waitingFor', { walletName: displayName })}
          {status === 'success' && t('connectionSuccessfulTitle')}
          {status === 'failed' &&
            (isDenied ? t('accessDeniedTitle') : t('loginFailed'))}
        </p>

        <p
          className="bluxcc:min-h-10 bluxcc:text-sm"
          style={{
            color: status === 'failed' ? FAILED_COLOR : appearance.textColor,
          }}
        >
          {status === 'loading' && waitingHelp}
          {status === 'success' && t('connectionSuccessfulMessage')}
          {status === 'failed' && (errorMessage || t('loginRetryMessage'))}
        </p>

        {status === 'failed' && isDenied && (
          <p
            className="bluxcc:text-sm bluxcc:opacity-70"
            style={{ color: appearance.textColor }}
          >
            {t('accessDeniedHelp')}
          </p>
        )}
      </div>

      <Divider />

      {status === 'loading' && telegram && botUsername && !miniAppInitData && (
        <TelegramWidget
          key={widgetKey}
          botUsername={botUsername}
          onAuth={handleTelegramAuth}
        />
      )}

      {status === 'loading' && (!telegram || !!miniAppInitData) && (
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

      {status === 'failed' &&
        (isDenied ? (
          <Button state="enabled" variant="fill" onClick={handleBack}>
            {t('back')}
          </Button>
        ) : (
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
        ))}
    </div>
  );
};

export default SocialsOnboarding;
