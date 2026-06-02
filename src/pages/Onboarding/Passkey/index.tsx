import { useEffect, useState } from 'react';
import { PasskeyFingerLogo } from '../../../assets';
import {
  apiGetUser,
  apiRegisterPasskey,
  apiRegisterPasskeyChallenge,
} from '../../../utils/api';
import { getState, useAppStore } from '../../../store';
import { setRecentLoginConfig } from '../../../utils/checkRecentLogins';
import { Route } from '../../../enums';
import continueLoginProcess from '../../../stellar/processes/continueLoginProcess';

type PasskeyStatus = 'loading' | 'failed' | 'success';

const texts: Record<PasskeyStatus, { title: string; content: string }> = {
  loading: {
    title: 'Waiting for passkey',
    content:
      'Please follow prompts to verify your passkey. You will have to sign up with another method first to register a passkey for your account.',
  },
  failed: {
    title: 'Something went wrong',
    content:
      'Passkey request timed out or rejected by user. You will have to sign up with another method first to register a passkey for your account.',
  },
  success: {
    title: 'Successful!',
    content: 'You are being redirected now.',
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
    throw new Error('Passkeys require a browser environment.');
  }

  if (!('credentials' in navigator)) {
    throw new Error('WebAuthn is not supported in this browser.');
  }

  if (!('PublicKeyCredential' in window)) {
    throw new Error('Passkeys are not supported in this browser.');
  }

  if (
    typeof PublicKeyCredential.isConditionalMediationAvailable !== 'function'
  ) {
    throw new Error(
      'Conditional passkey mediation is not supported in this browser.',
    );
  }

  const conditional =
    await PublicKeyCredential.isConditionalMediationAvailable();
  if (!conditional) {
    throw new Error(
      'Conditional passkey mediation is not available in this browser.',
    );
  }
}

async function continueWithPasskey(
  challenge: string,
  userId: string,
): Promise<PasskeyFlowResult> {
  await ensurePasskeySupport();

  const challengeInBuffer = new TextEncoder().encode(challenge).buffer;

  console.log('io0');

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challengeInBuffer,
        userVerification: 'required',
        rpId: window.location.hostname,
        timeout: 60000,
      },
    });

    console.log('io1');
    console.log(assertion);

    if (assertion instanceof PublicKeyCredential) {
      console.log('io2');

      return {
        step: 'login',
        credential: assertion,
      };
    }
  } catch (error) {
    throw error;
  }

  console.log('io3');

  console.log('io4');

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

  console.log('io5');

  if (!(created instanceof PublicKeyCredential)) {
    throw new Error('Passkey registration was not completed.');
  }

  console.log('io6');

  return {
    step: 'register',
    credential: created,
  };
}

const PasskeyOnboardingPage = () => {
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
      console.log('failed', e.message);

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
        <p>{texts[status].title}</p>

        <p>{texts[status].content}</p>
      </div>

      {status === 'failed' && (
        <button type="button" onClick={handlePasskeyRetry}>
          Retry
        </button>
      )}
    </div>
  );
};

export default PasskeyOnboardingPage;
