import { BLUX_API } from '../constants/consts';
import { ILoginMethods, AuthenticateApiResponse } from '../types';

// Display metadata for each social provider. The whole OAuth dance — building
// the provider authorization URL, the (fixed) redirect URI, and the
// code -> token exchange with the project's secret — now happens on the Blux
// API, so the kit only needs each provider's label to render the button and
// the result screen. Icons live in src/assets/socials.
type SocialProviderMeta = {
  displayName: string;
};

export const SOCIAL_PROVIDERS: Record<string, SocialProviderMeta> = {
  google: { displayName: 'Google' },
  farcaster: { displayName: 'Farcaster' },
  tiktok: { displayName: 'TikTok' },
  linkedin: { displayName: 'LinkedIn' },
  twitch: { displayName: 'Twitch' },
  kick: { displayName: 'Kick' },
  spotify: { displayName: 'Spotify' },
  instagram: { displayName: 'Instagram' },
  apple: { displayName: 'Apple' },
  discord: { displayName: 'Discord' },
  github: { displayName: 'GitHub' },
  meta: { displayName: 'Meta' },
  telegram: { displayName: 'Telegram' },
  microsoft: { displayName: 'Microsoft' },
  gitlab: { displayName: 'GitLab' },
  twitter: { displayName: 'X' },
  steam: { displayName: 'Steam' },
};

const NON_SOCIAL_METHODS = ['wallet', 'sms', 'email', 'passkey'];
const SOCIAL_ALIASES: Record<string, string> = { x: 'twitter' };

export const canonicalSocialName = (method: string): string =>
  SOCIAL_ALIASES[method.toLowerCase().trim()] || method.toLowerCase().trim();

export const isSocialProvider = (method: string): boolean =>
  !!SOCIAL_PROVIDERS[canonicalSocialName(method)];

export const getSocialDisplayName = (provider: string): string => {
  const name = canonicalSocialName(provider);

  return SOCIAL_PROVIDERS[name]?.displayName || name;
};

const warnedMethods = new Set<string>();

const warnOnce = (method: string, message: string) => {
  if (warnedMethods.has(method)) {
    return;
  }

  warnedMethods.add(method);
  console.warn(message);
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

  const enabled = new Set(
    apiResponse.socials.map((s) => canonicalSocialName(s)),
  );
  const result: string[] = [];

  for (const method of loginMethods) {
    const name = canonicalSocialName(String(method));

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

export const telegramBotUsername = (
  apiResponse?: AuthenticateApiResponse,
): string => {
  const entry = apiResponse?.socialsConfig?.find(
    (s) => s.provider === 'telegram',
  );

  return (entry?.publicId || '').replace(/^@/, '').trim();
};

export const telegramMiniAppsEnabled = (
  apiResponse?: AuthenticateApiResponse,
): boolean => {
  const entry = apiResponse?.socialsConfig?.find(
    (s) => s.provider === 'telegram',
  );

  return !!entry?.miniApps;
};

export const telegramWebAppInitData = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const telegram = (
    window as Window & {
      Telegram?: { WebApp?: { initData?: string } };
    }
  ).Telegram;

  return (telegram?.WebApp?.initData || '').trim();
};

export const isTelegramLogin = (
  provider: string,
  apiResponse?: AuthenticateApiResponse,
): boolean => {
  const name = canonicalSocialName(provider);
  const entry = apiResponse?.socialsConfig?.find((s) => s.provider === name);

  return (entry?.kind || (name === 'telegram' ? 'telegram' : '')) === 'telegram';
};

export type ISocialSession = {
  provider: string;
  popup: Window | null;
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

// The Blux API serves the whole OAuth flow from its own origin and posts the
// result back to us; we only trust messages that come from there.
const BLUX_ORIGIN = (() => {
  try {
    return new URL(BLUX_API).origin;
  } catch (_) {
    return '';
  }
})();

// Must be called synchronously inside a click handler, otherwise the browser
// blocks the popup. Opens the Blux-hosted OAuth starter, which redirects to the
// provider, handles the callback server-side with the project's secret and the
// fixed redirect URI, and posts the resulting JWT back to this window. The
// `origin` tells the API where to post the result; the `app_id` selects the
// project whose credentials to use, so the same OAuth app works on every site
// that embeds this kit with that appId.
export const beginSocialLogin = (
  provider: string,
  appId: string,
): ISocialSession => {
  cancelActiveSocialSession();

  if (!appId) {
    activeSession = {
      provider,
      popup: null,
      error: `BLUX: '${provider}' login is not fully configured for this app.`,
    };

    return activeSession;
  }

  const params = new URLSearchParams({
    app_id: appId,
    origin: window.location.origin,
  });

  const width = 480;
  const height = 640;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  const popup = window.open(
    `${BLUX_API}/auth/social/${encodeURIComponent(provider)}/start?${params.toString()}`,
    'bluxcc-social-login',
    `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
  );

  activeSession = {
    provider,
    popup,
  };

  return activeSession;
};

const POLL_INTERVAL_MS = 400;
const FLOW_TIMEOUT_MS = 5 * 60 * 1000;
// After the popup closes, give a brief grace period for a success message that
// may still be in flight before treating the close as a cancellation.
const CLOSE_GRACE_MS = 700;

type SocialAuthMessage = {
  source?: string;
  type?: string;
  status?: string;
  jwt?: string;
  error?: string;
};

// Waits for the Blux-hosted callback page to post the login result back to this
// window via postMessage ({ source:'blux', type:'social-auth', status, jwt }).
// The API closes the popup itself once it has posted, so a popup that closes
// without a message means the user dismissed it.
export const awaitSocialLogin = (session: ISocialSession): Promise<string> =>
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
    let settled = false;
    let timer: ReturnType<typeof setInterval>;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      settled = true;
      clearInterval(timer);

      if (closeTimer) {
        clearTimeout(closeTimer);
      }

      window.removeEventListener('message', onMessage);

      try {
        session.popup?.close();
      } catch (_) { }
    };

    const succeed = (jwt: string) => {
      if (settled) return;
      cleanup();
      resolve(jwt);
    };

    const fail = (message: string) => {
      if (settled) return;
      cleanup();
      reject(new Error(message));
    };

    const onMessage = (event: MessageEvent) => {
      // Only accept the result from the Blux API origin.
      if (BLUX_ORIGIN && event.origin !== BLUX_ORIGIN) {
        return;
      }

      const data = (event.data || {}) as SocialAuthMessage;

      if (data.source !== 'blux' || data.type !== 'social-auth') {
        return;
      }

      if (data.status === 'success' && data.jwt) {
        succeed(data.jwt);
      } else {
        fail(
          data.error
            ? `BLUX: ${data.error}`
            : 'BLUX: Login failed. Please try again.',
        );
      }
    };

    window.addEventListener('message', onMessage);

    timer = setInterval(() => {
      if (settled) {
        return;
      }

      if (Date.now() - startedAt > FLOW_TIMEOUT_MS) {
        fail('BLUX: Login timed out. Please try again.');

        return;
      }

      const popup = session.popup;

      if (!popup || popup.closed) {
        // The success message may still be queued; wait briefly before
        // treating the closed popup as a cancellation.
        clearInterval(timer);

        closeTimer = setTimeout(() => {
          fail('BLUX: The login window was closed.');
        }, CLOSE_GRACE_MS);
      }
    }, POLL_INTERVAL_MS);
  });
