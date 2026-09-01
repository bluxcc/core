import React, { useState, useMemo, useEffect } from 'react';

import { IWallet } from '../../types';
import { useAppStore } from '../../store';
import { apiSendOtp } from '../../utils/api';
import { isAccessDenied } from '../../utils/errors';
import { useLang } from '../../hooks/useLang';
import CDNFiles from '../../constants/cdnFiles';
import CardItem from '../../components/CardItem';
import CDNImage from '../../components/CDNImage';
import handleLogos from '../../utils/walletLogos';
import { Route, SupportedWallet } from '../../enums';
import { PhoneIcon } from '../../assets';
import {
  getContrastColor,
  isBackgroundDark,
} from '../../utils/helpers';
import connectWalletProcess from '../../stellar/processes/connectWalletProcess';
import { generateWalletConnectSession } from '../../utils/initializeWalletConnect';
import {
  canonicalSocialName,
  getEnabledSocials,
  isSocialProvider,
  startSocialLogin,
} from '../../utils/socialLogin';
import SocialLoginButton from './Socials/SocialLoginButton';

const Onboarding = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const [emailValue, setEmailValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');

  const { config, wallets, connectEmail, connectSms, setShowAllWallets } = store;
  const { appearance } = config;
  const loginMethods = config.loginMethods || [];

  const isPassKeyEnabled = loginMethods.includes('passkey');
  const isSmsEnabled =
    loginMethods.includes('sms') && store.apiResponse?.smsEnabled === true;

  // Socials the dev listed in loginMethods AND the owner enabled in the
  // dashboard (delivered by /auth/validate). Empty until apiResponse arrives.
  // Order follows loginMethods; disabled entries are omitted entirely.
  const enabledSocials = useMemo(
    () => getEnabledSocials(loginMethods, store.apiResponse),
    [loginMethods, store.apiResponse],
  );
  const primarySocial = enabledSocials[0];
  const otherSocials = enabledSocials.slice(1);

  const orderedLoginMethods = useMemo(() => {
    const methods = [...loginMethods].filter((method) => method !== 'passkey');
    return [...methods, ...(isPassKeyEnabled ? ['passkey'] : [])];
  }, [loginMethods, isPassKeyEnabled]);

  const normalizeMethod = (m?: string) =>
    m ? canonicalSocialName(String(m)) : '';

  // Methods that should not occupy a slot — same as if they were never listed.
  const isSkippedMethod = (m?: string) => {
    const name = normalizeMethod(m);

    if (!name) {
      return true;
    }

    if (name === 'sms' && !isSmsEnabled) {
      return true;
    }

    if (isSocialProvider(name) && name !== primarySocial) {
      return true;
    }

    if (
      !['wallet', 'email', 'sms', 'passkey'].includes(name) &&
      !isSocialProvider(name)
    ) {
      return true;
    }

    return false;
  };

  const nextVisibleMethod = (index: number) =>
    orderedLoginMethods.slice(index + 1).find((m) => !isSkippedMethod(m));

  const hiddenWallets = useMemo(() => {
    return wallets.length > 3 ? wallets.slice(2) : [];
  }, [wallets]);

  const visibleWallets = useMemo(() => {
    return wallets.length <= 3
      ? wallets
      : store.showAllWallets
        ? wallets.slice(2, wallets.length)
        : wallets.slice(0, 2);
  }, [wallets, store.showAllWallets]);

  useEffect(() => {
    if (store.walletConnect) {
      generateWalletConnectSession(store.walletConnect.client)
        .then((connection) => {
          store.setWalletConnectClient(store.walletConnect!.client, connection);
        })
        .catch(() => {});
    }
  }, []);

  const handleConnect = async (wallet: IWallet) => {
    if (wallet.name === SupportedWallet.WalletConnect) {
      store.setRoute(Route.WALLET_CONNECT);
    } else {
      connectWalletProcess(store, wallet);
    }
  };

  const handleConnectEmail = async () => {
    store.setLoginError(undefined);

    try {
      // Restriction list is enforced by POST /auth. Check before navigating to
      // OTP so a blocked email never sees the code screen.
      await apiSendOtp(config.appId, emailValue);
      connectEmail(emailValue);
    } catch (e) {
      // The project restricts access and this email is blocked: surface the
      // reason on the Failed screen. Other (network/server) errors leave the
      // user on the onboarding form so they can retry.
      if (isAccessDenied(e)) {
        store.setLoginError(e.message);
        store.setRoute(Route.FAILED);
      }
    }
  };

  const handleConnectSms = async () => {
    store.setLoginError(undefined);

    try {
      await apiSendOtp(config.appId, phoneValue, 'sms');
      connectSms(phoneValue);
    } catch (e) {
      if (isAccessDenied(e)) {
        store.setLoginError(e.message);
        store.setRoute(Route.FAILED);
      }
    }
  };

  const handleConnectSocial = (provider: string) => {
    startSocialLogin(provider, store.config.appId, store.apiResponse);
    store.connectSocial(provider);
  };

  const handleRedirectToOnboardingPasskey = () => {
    store.setRoute(Route.PASSKEY_ONBOARDING);
  };

  const renderDivider = () => (
    <div className="bluxcc:my-1 bluxcc:flex bluxcc:h-8 bluxcc:w-full bluxcc:items-center bluxcc:justify-center">
      <div
        className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0 bluxcc:z-10"
        style={{
          borderTop: `${appearance.borderWidth} dashed ${appearance.borderColor}`,
        }}
      />

      <span
        className="bluxcc:z-20 bluxcc:w-auto bluxcc:px-2 bluxcc:text-sm bluxcc:font-medium bluxcc:select-none"
        style={{
          background: appearance.background,
          color: appearance.borderColor,
        }}
      >
        {t('or')}
      </span>
    </div>
  );

  return (
    <div className="bluxcc:w-full">
      {appearance.logo && (
        <div className="bluxcc:my-6 bluxcc:flex bluxcc:max-h-20 bluxcc:w-full bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden">
          <img
            src={appearance.logo}
            alt={config.appName}
            width={152}
            height={60}
            className="bluxcc:max-h-20 bluxcc:max-w-45 bluxcc:select-none"
            loading="eager"
            decoding="async"
            draggable="false"
            style={{ contentVisibility: 'auto' }}
          />
        </div>
      )}

      <div>
        {orderedLoginMethods.map((method, index) => {
          const socialProvider = normalizeMethod(method);
          const nextMethod = nextVisibleMethod(index);
          const walletExists = orderedLoginMethods.includes('wallet');
          // Rows that are rendered as non-wallet login options. A divider
          // separates the wallet block from those rows on either side.
          const isAuthRow = (m?: string) => {
            const name = normalizeMethod(m);

            return (
              name === 'email' ||
              (name === 'sms' && isSmsEnabled) ||
              (!!primarySocial && name === primarySocial)
            );
          };
          const shouldRenderDivider =
            (walletExists &&
              !store.showAllWallets &&
              method === 'wallet' &&
              isAuthRow(nextMethod)) ||
            (walletExists && isAuthRow(method) && nextMethod === 'wallet');

          if (method === 'wallet') {
            return (
              <React.Fragment key="wallet">
                <div className="bluxcc:max-h-81 bluxcc:space-y-2 bluxcc:overflow-y-auto bluxcc:overflowStyle">
                  {visibleWallets.map((checkedWallet) => (
                    <CardItem
                      key={checkedWallet.name}
                      {...checkedWallet}
                      label={checkedWallet.name}
                      startIcon={handleLogos(
                        checkedWallet.name,
                        isBackgroundDark(appearance.background),
                      )}
                      onClick={() => handleConnect(checkedWallet)}
                    />
                  ))}

                  {hiddenWallets.length > 0 && !store.showAllWallets && (
                    <CardItem
                      endArrow
                      label={t('allStellarWallets')}
                      startIcon={
                        <CDNImage
                          name={CDNFiles.Stellar}
                          props={{
                            fill: getContrastColor(appearance.background),
                          }}
                        />
                      }
                      onClick={() => {
                        setShowAllWallets(true);
                      }}
                    />
                  )}
                  {shouldRenderDivider && renderDivider()}
                </div>
              </React.Fragment>
            );
          }

          if (
            !store.showAllWallets &&
            primarySocial &&
            socialProvider === primarySocial
          ) {
            // Render only the first occurrence so duplicate entries in
            // loginMethods don't produce duplicate buttons.
            const firstIndex = orderedLoginMethods.findIndex(
              (m) => normalizeMethod(m) === primarySocial,
            );

            if (firstIndex !== index) {
              return null;
            }

            return (
              <React.Fragment key={primarySocial}>
                <div className="bluxcc:mb-2">
                  <SocialLoginButton
                    provider={primarySocial}
                    onClick={handleConnectSocial}
                  />
                </div>

                {otherSocials.length > 0 && (
                  <div className="bluxcc:mb-2">
                    <CardItem
                      endArrow
                      label={t('otherSocials')}
                      startIcon={
                        <CDNImage
                          name={CDNFiles.Globe}
                          props={{ fill: appearance.textColor }}
                        />
                      }
                      onClick={() => store.setRoute(Route.OTHER_SOCIALS)}
                    />
                  </div>
                )}

                {shouldRenderDivider && renderDivider()}
              </React.Fragment>
            );
          }

          if (!store.showAllWallets && method === 'email') {
            return (
              <React.Fragment key="email">
                <div className="bluxcc:mb-2">
                  <CardItem
                    inputType="email"
                    variant="input"
                    startIcon={
                      <CDNImage
                        name={CDNFiles.SmallEmail}
                        props={{ fill: appearance.textColor }}
                      />
                    }
                    onChange={(value: string) => setEmailValue(value)}
                    onEnter={handleConnectEmail}
                    onSubmit={handleConnectEmail}
                  />
                </div>

                {shouldRenderDivider && renderDivider()}
              </React.Fragment>
            );
          }

          if (!store.showAllWallets && method === 'sms' && isSmsEnabled) {
            return (
              <React.Fragment key="sms">
                <div className="bluxcc:mb-2">
                  <CardItem
                    inputType="tel"
                    variant="input"
                    placeholder={t('phone')}
                    startIcon={
                      <PhoneIcon fill={appearance.textColor} />
                    }
                    onChange={(value: string) => setPhoneValue(value)}
                    onEnter={handleConnectSms}
                    onSubmit={handleConnectSms}
                  />
                </div>

                {shouldRenderDivider && renderDivider()}
              </React.Fragment>
            );
          }

          if (!store.showAllWallets && method === 'passkey') {
            return (
              <button
                key="passkey"
                onClick={handleRedirectToOnboardingPasskey}
                className="bluxcc:mt-6! bluxcc:w-full bluxcc:bg-transparent bluxcc:flex bluxcc:h-4 bluxcc:items-center bluxcc:justify-center bluxcc:text-sm bluxcc:leading-7 bluxcc:font-medium"
                style={{
                  color: appearance.accentColor,
                  fontFamily: appearance.fontFamily,
                }}
              >
                {t('logInWithPasskey')}
              </button>
            );
          }

          return null;
        })}
      </div>

      <div
        className="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:justify-center bluxcc:pt-4.25 bluxcc:text-center bluxcc:text-xs bluxcc:font-medium"
      >
        <a
          aria-label="blux website"
          href="https://blux.cc"
          target="_blank"
          rel="noreferrer"
          className="bluxcc:inline-block bluxcc:text-center bluxcc:no-underline"
          style={{
            color: appearance.textColor,
            fontFamily: appearance.fontFamily,
          }}
        >
          {t('poweredByBlux')}
        </a>
      </div>
    </div>
  );
};

export default Onboarding;
