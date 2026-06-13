import CDNFiles from '../constants/cdnFiles';
import {
  ILoginMethods,
  ISocialConfigEntry,
  AuthenticateApiResponse,
} from '../types';

// Mirror of the backend provider registry (api config.SocialProviders): the
// kit must know each provider's authorization endpoint to open the popup. The
// code -> token exchange happens server-side with the project's secret.
type SocialProviderMeta = {
  displayName: string;
  authUrl: string;
  scopes: string[];
  icon: CDNFiles;
  extraParams?: Record<string, string>;
};

export const SOCIAL_PROVIDERS: Record<string, SocialProviderMeta> = {
  google: {
    displayName: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: ['openid', 'email', 'profile'],
    icon: CDNFiles.Google,
    extraParams: {
      prompt: 'select_account',
    },
  },
};

const NON_SOCIAL_METHODS = ['wallet', 'sms', 'email', 'passkey'];

export const isSocialProvider = (method: string): boolean =>
  !!SOCIAL_PROVIDERS[method.toLowerCase().trim()];

const warnedMethods = new Set<string>();

const warnOnce = (method: string, _: string) => {
  if (warnedMethods.has(method)) {
    return;
  }

  warnedMethods.add(method);
};

// Intersection of the socials the dev asked for in config.loginMethods and
// the ones the project owner enabled in the dashboard (from /auth/validate).
// Order follows config.loginMethods. Unknown or not-enabled entries are
// ignored with a one-time warning.
export const getEnabledSocials = (
  loginMethods: ILoginMethods | string[],
  apiResponse?: AuthenticateApiResponse,
): string[] => {
  if (!apiResponse || !apiResponse.isValid) {
    return [];
  }

  const enabled = new Set(apiResponse.socials.map((s) => s.toLowerCase()));
  const result: string[] = [];

  for (const method of loginMethods) {
    const name = String(method).toLowerCase().trim();

    if (NON_SOCIAL_METHODS.includes(name)) {
      continue;
    }

    if (!SOCIAL_PROVIDERS[name]) {
      warnOnce(
        name,
        `BLUX: unknown login method '${name}' in config.loginMethods.`,
      );

      continue;
    }

    if (!enabled.has(name)) {
      warnOnce(
        name,
        `BLUX: '${name}' is in config.loginMethods but is not enabled for this app in the Blux dashboard.`,
      );

      continue;
    }

    if (!result.includes(name)) {
      result.push(name);
    }
  }

  return result;
};

export type ISocialSession = {
  provider: string;
  popup: Window | null;
  state: string;
  redirectUri: string;
  error?: string;
};

let activeSession: ISocialSession | null = null;

export const getActiveSocialSession = () => activeSession;

export const cancelActiveSocialSession = () => {
  if (activeSession?.popup && !activeSession.popup.closed) {
    try {
      activeSession.popup.close();
    } catch (_) { }
  }

  activeSession = null;
};

const randomState = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

// Must be called synchronously inside a click handler, otherwise the browser
// blocks the popup.
export const beginSocialLogin = (
  provider: string,
  socialsConfig: ISocialConfigEntry[],
): ISocialSession => {
  cancelActiveSocialSession();

  const meta = SOCIAL_PROVIDERS[provider];
  const cfg = socialsConfig.find((s) => s.provider === provider);

  if (!meta || !cfg || !cfg.clientId || !cfg.redirectUri) {
    activeSession = {
      provider,
      popup: null,
      state: '',
      redirectUri: '',
      error: `BLUX: '${provider}' login is not fully configured for this app.`,
    };

    return activeSession;
  }

  const state = randomState();

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: meta.scopes.join(' '),
    state,
    ...(meta.extraParams || {}),
  });

  const width = 480;
  const height = 640;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  const popup = window.open(
    `${meta.authUrl}?${params.toString()}`,
    'bluxcc-social-login',
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );

  activeSession = {
    provider,
    popup,
    state,
    redirectUri: cfg.redirectUri,
  };

  return activeSession;
};

const POLL_INTERVAL_MS = 300;
const FLOW_TIMEOUT_MS = 5 * 60 * 1000;

// Waits for the provider to redirect the popup back to the owner-configured
// redirect_uri carrying ?code=. While the popup is on the provider's origin,
// reading its location throws and we keep polling; once it is back on an
// origin we can read, we pull the query params and close it. The redirect
// page itself does not need to exist (a 404 there is fine) - only its URL
// matters.
export const awaitSocialAuthCode = (session: ISocialSession): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    if (session.error) {
      reject(new Error(session.error));

      return;
    }

    if (!session.popup) {
      reject(
        new Error('BLUX: Popup was blocked. Please allow popups and try again.'),
      );

      return;
    }

    const startedAt = Date.now();

    const timer = setInterval(() => {
      const popup = session.popup;

      const stop = () => {
        clearInterval(timer);

        try {
          popup?.close();
        } catch (_) { }
      };

      if (!popup || popup.closed) {
        clearInterval(timer);
        reject(new Error('BLUX: The login window was closed.'));

        return;
      }

      if (Date.now() - startedAt > FLOW_TIMEOUT_MS) {
        stop();
        reject(new Error('BLUX: Login timed out. Please try again.'));

        return;
      }

      let href = '';

      try {
        href = popup.location.href;
      } catch (_) {
        // Cross-origin (still on the provider's page) - keep polling.
        return;
      }

      if (!href || href === 'about:blank') {
        return;
      }

      let url: URL;

      try {
        url = new URL(href);
      } catch (_) {
        return;
      }

      const code = url.searchParams.get('code');
      const errorParam = url.searchParams.get('error');

      if (!code && !errorParam) {
        return;
      }

      const returnedState = url.searchParams.get('state');

      stop();

      if (errorParam) {
        reject(
          new Error(
            errorParam === 'access_denied'
              ? 'BLUX: Login was cancelled.'
              : `BLUX: Provider returned an error: ${errorParam}`,
          ),
        );
      } else if (returnedState !== session.state) {
        reject(new Error('BLUX: Login state mismatch. Please try again.'));
      } else {
        resolve(code as string);
      }
    }, POLL_INTERVAL_MS);
  });
