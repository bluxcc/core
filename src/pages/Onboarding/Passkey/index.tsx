import { useEffect, useState } from 'react';
import { PasskeyFingerLogo } from '../../../assets';
import {
  apiGetUser,
  apiRegisterPasskey,
  apiRegisterPasskeyChallenge,
} from '../../../utils/api';
import { getState, useAppStore } from '../../../store';
import { useLang } from '../../../hooks/useLang';
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

  if (
    typeof PublicKeyCredential.isConditionalMediationAvailable !== 'function'
  ) {
    throw new Error(
      'BLUX: Conditional passkey mediation is not supported in this browser.',
    );
  }

  const conditional =
    await PublicKeyCredential.isConditionalMediationAvailable();
  if (!conditional) {
    throw new Error(
      'BLUX: Conditional passkey mediation is not available in this browser.',
    );
  }
}

async function continueWithPasskey(
  challenge: string,
  userId: string,
): Promise<PasskeyFlowResult> {
  await ensurePasskeySupport();

  const challengeInBuffer = new TextEncoder().encode(challenge).buffer;

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challengeInBuffer,
        userVerification: 'required',
        rpId: window.location.hostname,
        timeout: 60000,
      },
    });

    if (assertion instanceof PublicKeyCredential) {
      return {
        step: 'login',
        credential: assertion,
      };
    }
  } catch (error) {
    throw error;
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
      setStatus('failed');
    }
  };

  const completePasskeyAuthentication = async (jwt: string) => {
    // @ts-ignore
    setRecentLoginConfig('passkey', store.user?.authValue, Date.now(), jwt);

    store.setAuth({
      isAuthenticated: true,
      JWT: jwt,
    });

    const result = await apiGetUser(jwt);

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <PasskeyFingerLogo />

      <div>
        <p>{t(textKeys[status].title)}</p>

        <p>{t(textKeys[status].content)}</p>
      </div>

      {status === 'failed' && (
        <button type="button" onClick={handlePasskeyRetry}>
          {t('tryAgain')}
        </button>
      )}
    </div>
  );
};

export default PasskeyOnboardingPage;
