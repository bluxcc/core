import { useEffect, useState } from 'react';
import { PasskeyFingerLogo } from '../../../assets';
import {
  apiGetUser,
  apiPasskeyVerify,
  apiPasskeyChallenge,
} from '../../../utils/api';
import { getState, useAppStore } from '../../../store';
import { base64UrlToBuffer, hexToRgba } from '../../../utils/helpers';
import {
  getStoredPasskeyCredentialId,
  setStoredPasskeyCredentialId,
  createPasskeyRegistrationHandle,
} from '../../../utils/passkeyCredentials';
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

async function runPasskeyCeremony(
  challenge: string,
  userId: string,
  mode: 'login' | 'register',
  credentialId?: string,
): Promise<PasskeyFlowResult> {
  await ensurePasskeySupport();

  // The API issues the challenge as base64url. The authenticator must sign the
  // raw bytes so the browser re-encodes them to the exact string the server
  // stored and matches against clientDataJSON.challenge. (UTF-8-encoding the
  // string instead would sign a different value and fail verification.)
  const challengeBytes = base64UrlToBuffer(challenge);
  const rpId = window.location.hostname;

  // Returning user: we already know which credential to assert, and the
  // challenge was bound to that credential's owner, so target it explicitly
  // rather than relying on discoverable-credential selection.
  if (mode === 'login' && credentialId) {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challengeBytes,
        rpId,
        userVerification: 'preferred',
        timeout: 60000,
        allowCredentials: [
          {
            id: base64UrlToBuffer(credentialId),
            type: 'public-key',
          },
        ],
      },
    });

    if (!(assertion instanceof PublicKeyCredential)) {
      throw new Error('BLUX: Passkey login was not completed.');
    }

    return {
      step: 'login',
      credential: assertion,
    };
  }

  // First-time user on this browser: enroll a new passkey.
  const created = await navigator.credentials.create({
    publicKey: {
      challenge: challengeBytes,
      rp: {
        name: 'BLUX',
        id: rpId,
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
        userVerification: 'preferred',
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
      const appId = store.config.appId;

      // Identifier-first: a stored credential id means this browser already
      // registered a passkey for this app, so log it in; otherwise enroll a new
      // one. The challenge's auth_value must identify the right user row — the
      // credential id for login, a fresh unique handle for registration.
      const storedCredentialId = getStoredPasskeyCredentialId(appId);
      const mode: 'login' | 'register' = storedCredentialId
        ? 'login'
        : 'register';
      const challengeAuthValue =
        storedCredentialId ?? createPasskeyRegistrationHandle();

      const challenge = await apiPasskeyChallenge(appId, challengeAuthValue);

      const passkeyResult = await runPasskeyCeremony(
        challenge.challenge,
        String(challenge.user_id),
        mode,
        storedCredentialId ?? undefined,
      );

      const jwt = await apiPasskeyVerify(appId, challenge, passkeyResult);

      // Remember the real credential id so the next visit logs in instead of
      // attempting to register again (which the server rejects as a duplicate).
      setStoredPasskeyCredentialId(appId, passkeyResult.credential.id);

      setStatus('success');

      await completePasskeyAuthentication(jwt);
    } catch (e: any) {
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
