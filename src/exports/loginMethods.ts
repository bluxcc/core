import { Route, SupportedWallet } from '../enums';
import { ISocialProvider, IWallet } from '../types';
import { getState, IUser } from '../store';
import { apiSendOtp, apiTelegramLogin, apiVerifyOtp } from '../utils/api';
import {
  assertAppIsValid,
  isAppValidated,
  waitForBluxReady,
} from '../utils/appValidity';
import { checkRecentLogins } from '../utils/checkRecentLogins';
import { canonicalWalletName } from '../utils/helpers';
import { authenticateWithPasskey } from '../utils/passkey';
import {
  awaitSocialLogin,
  beginSocialLogin,
  canonicalSocialName,
  getEnabledSocials,
  isSocialProvider,
  isTelegramLogin,
  telegramMiniAppsEnabled,
  telegramWebAppInitData,
} from '../utils/socialLogin';
import { walletsConfig } from '../wallets';
import connectWalletProcess from '../stellar/processes/connectWalletProcess';
import { completeLoginProcess } from '../stellar/processes/continueLoginProcess';
import { hydrateUserFromJwt } from '../stellar/processes/hydrateUserFromJwt';

/** sendCode + loginWithCode pair returned by {@link loginEmail} / {@link loginSms}. */
export type LoginCodeApi = {
  /** Send a one-time code to the identifier (email address or phone number). */
  sendCode: (identifier: string) => Promise<void>;
  /**
   * Verify the one-time code and complete login.
   *
   * @returns The authenticated user.
   */
  loginWithCode: (identifier: string, code: string) => Promise<IUser>;
};

/** {@link loginEmail} / {@link loginSms}: call it for the hook-shaped pair, or use the methods directly. */
export type LoginCodeFn = (() => LoginCodeApi) & LoginCodeApi;

const currentUser = (): IUser | undefined => {
  const { user } = getState();

  return user?.address ? user : undefined;
};

/** Sync ready-check for click handlers (OAuth popup, WebAuthn, wallet extensions). */
const assertReadyNow = (): void => {
  if (!getState().authState.isReady || !isAppValidated()) {
    throw new Error(
      'BLUX: SDK is not ready yet. Wait until blux.isReady is true.',
    );
  }

  assertAppIsValid();
};

const loginMethodsList = (): string[] =>
  (getState().config.loginMethods || []).map((method) =>
    canonicalSocialName(String(method)),
  );

const assertLoginMethodEnabled = (method: string): void => {
  const name = canonicalSocialName(method);
  const methods = loginMethodsList();
  const state = getState();

  if (name === 'email' || name === 'passkey' || name === 'wallet') {
    if (!methods.includes(name)) {
      throw new Error(
        `BLUX: '${name}' is not enabled. Add '${name}' to config.loginMethods.`,
      );
    }

    return;
  }

  if (name === 'sms') {
    if (!methods.includes('sms')) {
      throw new Error(
        `BLUX: 'sms' is not enabled. Add 'sms' to config.loginMethods.`,
      );
    }

    if (state.apiResponse?.smsEnabled !== true) {
      throw new Error(
        'BLUX: SMS login requires a paid Blux plan. SMS will not work until this app is upgraded.',
      );
    }

    return;
  }

  if (!isSocialProvider(name)) {
    throw new Error(`BLUX: unknown login method '${method}'.`);
  }

  const enabled = getEnabledSocials(
    state.config.loginMethods || [],
    state.apiResponse,
  );

  if (!enabled.includes(name)) {
    throw new Error(
      `BLUX: '${name}' is not enabled for this app. Add it to loginMethods and enable it in the Blux dashboard.`,
    );
  }
};

const createLoginPromise = (): Promise<IUser> => {
  const store = getState();
  const existing = currentUser();

  if (existing) {
    return Promise.resolve(existing);
  }

  if (store.login?.promise && !store.login.isSilent) {
    return store.login.promise;
  }

  let resolver: (value: IUser) => void;
  let rejecter: (reason: any) => void;

  const promise = new Promise<IUser>((res, rej) => {
    resolver = res;
    rejecter = rej;
  });

  store.setLogin({
    promise,
    isSilent: false,
    // @ts-ignore
    resolver,
    // @ts-ignore
    rejecter,
  });

  return promise;
};

/**
 * Internal login driver. Prefer the public {@link login}.
 *
 * @param isSilent - When `true`, tries to restore a recent session without opening the modal.
 * @returns A promise that resolves to the authenticated user.
 */
export const _login = (isSilent: boolean) => {
  const store = getState();

  if (store.user && store.user.address) {
    return Promise.resolve(store.user);
  }

  // Interactive login is already in flight. Reuse it so a second login()
  // cannot reset the onboarding view while the user is browsing wallets.
  if (!isSilent && store.login?.promise && !store.login.isSilent) {
    if (!store.modal.isOpen) {
      store.openModal(Route.ONBOARDING);
    }

    return store.login.promise;
  }

  let resolver: (value: IUser) => void;
  let rejecter: (reason: any) => void;

  const promise = new Promise<IUser>((res, rej) => {
    resolver = res;
    rejecter = rej;
  });

  store.setLogin({
    promise,
    isSilent,
    // @ts-ignore
    resolver,
    // @ts-ignore
    rejecter,
  });

  if (isSilent) {
    checkRecentLogins()
      .then(() => {
        const { user } = getState();

        if (user) {
          resolver(user);
        } else {
        }
      })
      .catch(() => {})
      .finally(() => {
        // A later interactive login() overwrites this slot. Do not clear it.
        if (getState().login?.promise === promise) {
          store.setLogin(undefined);
        }
      });

    return promise;
  }

  // `showAllWallets` is left alone while the modal is already open so a
  // second login() cannot yank the user off the all-wallets list. Closing
  // the modal (or opening a fresh one) is what resets it.
  if (!store.modal.isOpen) {
    store.openModal(Route.ONBOARDING, { walletOnly: false });
  }

  return promise;
};

/**
 * Opens the Blux modal so the user can connect a wallet or sign in, resolving
 * once authenticated. Waits for the SDK to finish initializing first.
 *
 * @returns The authenticated user.
 */
export const login = async (): Promise<IUser> => {
  await waitForBluxReady();

  // A bad appId (missing, wrong, deleted, used from a disallowed origin, or an
  // unreachable Blux API) disables login entirely — throw before the onboarding
  // modal can ever open.
  assertAppIsValid();

  getState().setWalletOnlyOnboarding(false);

  return _login(false);
};

const sendOtpCode = async (
  method: 'email' | 'sms',
  identifier: string,
): Promise<void> => {
  await waitForBluxReady();
  assertAppIsValid();
  assertLoginMethodEnabled(method);

  const value = identifier?.trim();

  if (!value) {
    throw new Error(
      method === 'sms'
        ? 'BLUX: Phone number is required.'
        : 'BLUX: Email is required.',
    );
  }

  await apiSendOtp(getState().config.appId, value, method);
};

const loginWithOtpCode = async (
  method: 'email' | 'sms',
  identifier: string,
  code: string,
): Promise<IUser> => {
  await waitForBluxReady();
  assertAppIsValid();
  assertLoginMethodEnabled(method);

  const existing = currentUser();

  if (existing && getState().authState.isAuthenticated) {
    return existing;
  }

  const value = identifier?.trim();
  const otp = code?.trim();

  if (!value) {
    throw new Error(
      method === 'sms'
        ? 'BLUX: Phone number is required.'
        : 'BLUX: Email is required.',
    );
  }

  if (!otp) {
    throw new Error('BLUX: Code is required.');
  }

  const jwt = await apiVerifyOtp(
    getState().config.appId,
    {
      address: '',
      authMethod: method,
      authValue: value,
      walletPassphrase: '',
    },
    otp,
  );

  if (!jwt) {
    throw new Error('BLUX: invalid code');
  }

  const user = await hydrateUserFromJwt(jwt, method, value);

  completeLoginProcess();

  return getState().user ?? user;
};

const asLoginCodeFn = (api: LoginCodeApi): LoginCodeFn =>
  Object.assign(() => api, api);

/**
 * Headless email login. Mirrors Privy's `sendCode` + `loginWithCode` so a React
 * hook can wrap this directly:
 *
 * ```ts
 * const { sendCode, loginWithCode } = blux.loginEmail();
 * await sendCode('user@example.com');
 * const user = await loginWithCode('user@example.com', '123456');
 * ```
 *
 * `blux.loginEmail.sendCode(...)` works the same way without calling the function.
 * Does not open the Blux modal; render your own email / OTP UI.
 */
export const loginEmail: LoginCodeFn = asLoginCodeFn({
  sendCode: (email) => sendOtpCode('email', email),
  loginWithCode: (email, code) => loginWithOtpCode('email', email, code),
});

/**
 * Headless SMS login. Same shape as {@link loginEmail}:
 *
 * ```ts
 * const { sendCode, loginWithCode } = blux.loginSms();
 * await sendCode('+15555555555');
 * const user = await loginWithCode('+15555555555', '123456');
 * ```
 *
 * Does not open the Blux modal. SMS must be in `loginMethods` and the app must
 * be on a paid plan (`smsEnabled` from `/auth/validate`).
 */
export const loginSms: LoginCodeFn = asLoginCodeFn({
  sendCode: (phone) => sendOtpCode('sms', phone),
  loginWithCode: (phone, code) => loginWithOtpCode('sms', phone, code),
});

export type LoginOAuthOptions = {
  /**
   * Telegram Login Widget user object, or `{ init_data }` from a Telegram Mini
   * App. Required for Telegram unless Mini App init data is already on `window`.
   */
  telegramUser?: Record<string, unknown>;
};

/**
 * Headless social login. Opens the provider popup (must run from a click
 * handler so the browser does not block it) and resolves with the user.
 *
 * Telegram cannot use that popup (the bot is bound to this origin). Pass the
 * widget payload as `options.telegramUser`, or call this from a Mini App where
 * init data is present. To show Blux's Telegram widget instead, use {@link login}.
 *
 * @param provider - A social name from {@link ISocialProvider} (`'google'`, `'apple'`, ...).
 * @param options - Telegram-only extras.
 */
export const loginOAuth = async (
  provider: ISocialProvider | string,
  options?: LoginOAuthOptions,
): Promise<IUser> => {
  // Must not await before opening the provider popup — browsers treat that as
  // losing the user gesture and block the window.
  assertReadyNow();

  const name = canonicalSocialName(String(provider));

  assertLoginMethodEnabled(name);

  const existing = currentUser();

  if (existing && getState().authState.isAuthenticated) {
    return existing;
  }

  const state = getState();

  if (isTelegramLogin(name, state.apiResponse)) {
    let payload = options?.telegramUser;

    if (!payload && telegramMiniAppsEnabled(state.apiResponse)) {
      const initData = telegramWebAppInitData();

      if (initData) {
        payload = { init_data: initData };
      }
    }

    if (!payload) {
      throw new Error(
        "BLUX: Telegram login needs the Login Widget payload or Mini App init data. Pass it as loginOAuth('telegram', { telegramUser }) or use blux.login() to show the widget.",
      );
    }

    const jwt = await apiTelegramLogin(state.config.appId, payload);
    const user = await hydrateUserFromJwt(jwt, name);

    completeLoginProcess();

    return getState().user ?? user;
  }

  // Must stay synchronous with the caller until the popup opens, otherwise the
  // browser blocks it.
  const session = beginSocialLogin(name, state.config.appId);
  const jwt = await awaitSocialLogin(session);
  const user = await hydrateUserFromJwt(jwt, name);

  completeLoginProcess();

  return getState().user ?? user;
};

/**
 * Headless passkey login. Triggers the WebAuthn ceremony (register on first
 * visit, assert on later visits) and resolves with the user. Must run from a
 * user gesture. Does not open the Blux modal.
 */
export const loginPasskey = async (): Promise<IUser> => {
  assertReadyNow();
  assertLoginMethodEnabled('passkey');

  const existing = currentUser();

  if (existing && getState().authState.isAuthenticated) {
    return existing;
  }

  const jwt = await authenticateWithPasskey(getState().config.appId);
  const user = await hydrateUserFromJwt(jwt, 'passkey');

  completeLoginProcess();

  return getState().user ?? user;
};

const resolveAvailableWallet = (walletName: string): IWallet => {
  const canonical = canonicalWalletName(walletName);
  const available = getState().wallets.find(
    (wallet) => canonicalWalletName(wallet.name) === canonical,
  );

  if (available) {
    return available;
  }

  const known = Object.values(walletsConfig).find(
    (wallet) =>
      wallet.name !== SupportedWallet.Api &&
      canonicalWalletName(wallet.name) === canonical,
  );

  if (known) {
    throw new Error(`BLUX: '${known.name}' is not available in this browser.`);
  }

  throw new Error(`BLUX: Unknown wallet '${walletName}'.`);
};

const loginWithNamedWallet = async (walletName: string): Promise<IUser> => {
  const wallet = resolveAvailableWallet(walletName);

  // WalletConnect has no extension to open — pairing is the Blux QR screen.
  // Every other named wallet talks to the wallet itself and never opens Blux.
  if (wallet.name === SupportedWallet.WalletConnect) {
    const promise = createLoginPromise();

    connectWalletProcess(getState(), wallet);

    return promise;
  }

  const user = await connectWalletProcess(getState(), wallet, {
    headless: true,
  });

  if (!user) {
    throw new Error('BLUX: Failed to login!');
  }

  return user;
};

/**
 * Wallet login.
 *
 * - No argument: opens the Blux onboarding modal showing only the scrollable
 *   wallet list (email / SMS / social / passkey rows are hidden).
 * - With a wallet name (`'freighter'`, `'rabet'`, ...): opens that wallet's
 *   own prompt and never the Blux modal. WalletConnect is the exception and
 *   still uses the Blux QR screen.
 *
 * @returns The authenticated user.
 */
export async function loginWallet(walletName?: string): Promise<IUser> {
  const named = walletName?.trim();

  if (named) {
    // wallet.connect() must stay in the click call stack.
    assertReadyNow();
    assertLoginMethodEnabled('wallet');

    const existing = currentUser();

    if (existing && getState().authState.isAuthenticated) {
      return existing;
    }

    return loginWithNamedWallet(named);
  }

  await waitForBluxReady();
  assertAppIsValid();
  assertLoginMethodEnabled('wallet');

  const existing = currentUser();

  if (existing && getState().authState.isAuthenticated) {
    return existing;
  }

  const promise = createLoginPromise();
  const store = getState();

  if (!store.modal.isOpen) {
    store.openModal(Route.ONBOARDING, { walletOnly: true });
  } else {
    store.setWalletOnlyOnboarding(true);
    store.setRoute(Route.ONBOARDING);
  }

  return promise;
}
