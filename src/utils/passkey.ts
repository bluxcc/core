import { apiPasskeyChallenge, apiPasskeyVerify } from './api';
import { base64UrlToBuffer } from './helpers';
import {
  createPasskeyRegistrationHandle,
  getStoredPasskeyCredentialId,
  setStoredPasskeyCredentialId,
} from './passkeyCredentials';

export type PasskeyFlowResult =
  | {
      step: 'login';
      credential: PublicKeyCredential;
    }
  | {
      step: 'register';
      credential: PublicKeyCredential;
    };

export async function ensurePasskeySupport(): Promise<void> {
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

export async function runPasskeyCeremony(
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

/**
 * Runs the full passkey register-or-login ceremony and returns a session JWT.
 * Does not persist the session; the caller hydrates the user and completes login.
 */
export async function authenticateWithPasskey(appId: string): Promise<string> {
  if (!appId) {
    throw new Error('BLUX: appId is missing in config.');
  }

  const storedCredentialId = getStoredPasskeyCredentialId(appId);
  const mode: 'login' | 'register' = storedCredentialId ? 'login' : 'register';
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

  return jwt;
}
