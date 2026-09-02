import { useEffect, useState } from 'react';
import { PasskeyFingerLogo } from '../../../assets';
import { getState, useAppStore } from '../../../store';
import { hexToRgba } from '../../../utils/helpers';
import { authenticateWithPasskey } from '../../../utils/passkey';
import { useLang } from '../../../hooks/useLang';
import Button from '../../../components/Button';
import Divider from '../../../components/Divider';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import { Route } from '../../../enums';
import continueLoginProcess from '../../../stellar/processes/continueLoginProcess';
import { hydrateUserFromJwt } from '../../../stellar/processes/hydrateUserFromJwt';

type PasskeyStatus = 'loading' | 'failed' | 'success';

const textKeys: Record<
  PasskeyStatus,
  {
    title: 'passkeyWaitingTitle' | 'passkeyFailedTitle' | 'passkeySuccessTitle';
    content: 'passkeyWaitingHelp' | 'passkeyFailedHelp' | 'passkeySuccessHelp';
  }
> = {
  loading: {
    title: 'passkeyWaitingTitle',
    content: 'passkeyWaitingHelp',
  },
  failed: {
    title: 'passkeyFailedTitle',
    content: 'passkeyFailedHelp',
  },
  success: {
    title: 'passkeySuccessTitle',
    content: 'passkeySuccessHelp',
  },
};

const PasskeyOnboardingPage = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;
  const [status, setStatus] = useState<PasskeyStatus>('loading');

  const passkeyLoginFlow = async () => {
    try {
      const jwt = await authenticateWithPasskey(store.config.appId);

      setStatus('success');

      await hydrateUserFromJwt(jwt, 'passkey');

      setTimeout(() => {
        if (!getState().modal.isOpen) {
          return;
        }

        store.setRoute(Route.SUCCESSFUL);

        setTimeout(() => {
          if (!getState().modal.isOpen) {
            return;
          }

          continueLoginProcess();
        }, 1000);
      });
    } catch (e: any) {
      setStatus('failed');
    }
  };

  useEffect(() => {
    passkeyLoginFlow();
  }, []);

  const handlePasskeyRetry = () => {
    setStatus('loading');

    passkeyLoginFlow();
  };

  const renderIcon = () => {
    if (status === 'success') {
      return (
        <div
          className="bluxcc:mb-6 bluxcc:flex bluxcc:size-17 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full"
          style={{ background: hexToRgba(appearance.accentColor, 0.1) }}
        >
          <CDNImage
            name={CDNFiles.GreenCheck}
            props={{ fill: appearance.accentColor }}
          />
        </div>
      );
    }

    if (status === 'failed') {
      return (
        <div className="bluxcc:mb-6 bluxcc:flex bluxcc:items-center bluxcc:justify-center">
          <CDNImage name={CDNFiles.RedExclamation} props={{}} />
        </div>
      );
    }

    return (
      <div
        className="bluxcc:mb-6 bluxcc:flex bluxcc:size-17 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full"
        style={{
          background: hexToRgba(appearance.accentColor, 0.1),
          color: appearance.accentColor,
        }}
      >
        <PasskeyFingerLogo />
      </div>
    );
  };

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      {renderIcon()}

      <div className="bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl">{t(textKeys[status].title)}</p>

        <p className="bluxcc:text-sm bluxcc:leading-5">
          {t(textKeys[status].content)}
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
          {t('passkeyVerifying')}
        </Button>
      )}

      {status === 'success' && (
        <Button state="disabled" variant="outline">
          {t('loggingIn')}
        </Button>
      )}

      {status === 'failed' && (
        <Button onClick={handlePasskeyRetry} state="enabled" variant="outline">
          {t('tryAgain')}
        </Button>
      )}
    </div>
  );
};

export default PasskeyOnboardingPage;
