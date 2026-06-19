import { useEffect, useState } from 'react';
import { PasskeyFingerLogo } from '../../../assets';
import {
  apiGetUser,
  apiRegisterPasskey,
  apiRegisterPasskeyChallenge,
} from '../../../utils/api';
import { getState, useAppStore } from '../../../store';
import { hexToRgba } from '../../../utils/helpers';
import { useLang } from '../../../hooks/useLang';
import Button from '../../../components/Button';
import Divider from '../../../components/Divider';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import { setRecentLoginConfig } from '../../../utils/checkRecentLogins';
import { Route } from '../../../enums';
import continueLoginProcess from '../../../stellar/processes/continueLoginProcess';

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

export type PasskeyFlowResult =
  | {
    step: 'login';
    credential: PublicKeyCredential;
  }
  | {
    step: 'register';
    credential: PublicKeyCredential;
  };

async function ensurePasskeySupport(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('BLUX: Passkeys require a browser environment.');
  }

  if (!('credentials' in navigator)) {
    throw new Error('BLUX: WebAuthn is not supported in this browser.');
  }

  if (!('PublicKeyCredential' in window)) {
    throw new Error('BLUX: Passkeys are not supported in this browser.');
  }
}

async function continueWithPasskey(
  challenge: string,
  userId: string,
): Promise<PasskeyFlowResult> {
  await ensurePasskeySupport();

  // The server stores the challenge as a plain string and validates it as the
  // UTF-8 text of clientDataJSON.challenge, so the bytes handed to the
  // authenticator must be that string encoded as UTF-8 (not base64url-decoded).
  const challengeInBuffer = new TextEncoder().encode(challenge).buffer;

  // Returning users already have a discoverable passkey for this rpId, so try a
  // login first. A first-time user has none, in which case get() rejects (e.g.
  // NotAllowedError) — that's expected, so swallow it and fall through to
  // registration below instead of failing the whole flow.
  let assertion: Credential | null = null;
  try {
    assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challengeInBuffer,
        userVerification: 'required',
        rpId: window.location.hostname,
        timeout: 60000,
      },
    });
  } catch (_) {
    assertion = null;
  }

  if (assertion instanceof PublicKeyCredential) {
    return {
      step: 'login',
      credential: assertion,
    };
  }

  const created = await navigator.credentials.create({
    publicKey: {
      challenge: challengeInBuffer,
      rp: {
        name: 'BLUX',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: 'Blux User',
        displayName: 'Blux User',
      },
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7, // ES256
        },
      ],
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    },
  });

  if (!(created instanceof PublicKeyCredential)) {
    throw new Error('BLUX: Passkey registration was not completed.');
  }

  return {
    step: 'register',
    credential: created,
  };
}

const PasskeyOnboardingPage = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;
  const [status, setStatus] = useState<PasskeyStatus>('loading');

  const passkeyLoginFlow = async () => {
    try {
      const passkeyRegistrationResult = await apiRegisterPasskeyChallenge(
        store.config.appId,
      );

      const passkeyResult = await continueWithPasskey(
        passkeyRegistrationResult.challenge,
        passkeyRegistrationResult.user_id,
      );

      const jwt = await apiRegisterPasskey(
        store.config.appId,
        passkeyRegistrationResult,
        passkeyResult,
      );

      setStatus('success');

      await completePasskeyAuthentication(jwt);
    } catch (e: any) {
      console.error('BLUX: passkey login failed:', e?.message || e);
      setStatus('failed');
    }
  };

  const completePasskeyAuthentication = async (jwt: string) => {
    store.setAuth({
      isAuthenticated: true,
      JWT: jwt,
    });

    const result = await apiGetUser(jwt);

    // Persist the credential id the server resolved for this passkey (store.user
    // isn't populated yet at this point, so reading it here would store
    // undefined and silently break recent-login restore).
    setRecentLoginConfig('passkey', result.auth_value, Date.now(), jwt);

    store.connectWalletSuccessful(
      result.public_key,
      store.stellar?.activeNetwork || '',
    );

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
