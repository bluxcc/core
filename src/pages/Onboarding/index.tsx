import React, { useState, useMemo, useEffect } from 'react';

import { IWallet } from '../../types';
import { useAppStore } from '../../store';
import { apiSendOtp } from '../../utils/api';
import { useLang } from '../../hooks/useLang';
import CDNFiles from '../../constants/cdnFiles';
import CardItem from '../../components/CardItem';
import CDNImage from '../../components/CDNImage';
import handleLogos from '../../utils/walletLogos';
import { Route, SupportedWallet } from '../../enums';
import { getContrastColor, isBackgroundDark } from '../../utils/helpers';
import connectWalletProcess from '../../stellar/processes/connectWalletProcess';
import { generateWalletConnectSession } from '../../utils/initializeWalletConnect';
import {
  SOCIAL_PROVIDERS,
  beginSocialLogin,
  getEnabledSocials,
} from '../../utils/socialLogin';

const Onboarding = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const [inputValue, setInputValue] = useState('');

  const { config, wallets, connectEmail, setShowAllWallets } = store;
  const { appearance } = config;
  const loginMethods = config.loginMethods || [];

  const isPassKeyEnabled = loginMethods.includes('passkey');

  // Socials the dev listed in loginMethods AND the owner enabled in the
  // dashboard (delivered by /auth/validate). Empty until apiResponse arrives.
  const enabledSocials = useMemo(
    () => getEnabledSocials(loginMethods, store.apiResponse),
    [loginMethods, store.apiResponse],
  );

  const orderedLoginMethods = useMemo(() => {
    const methods = [...loginMethods].filter((method) => method !== 'passkey');
    return [...methods, ...(isPassKeyEnabled ? ['passkey'] : [])];
  }, [loginMethods, isPassKeyEnabled]);

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
        .catch((_e) => { });
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
    try {
      connectEmail(inputValue);

      await apiSendOtp(config.appId, inputValue);
    } catch (e) {
      // TODO
      // SHOW ERROR, SOMETHING FAILED AND IT IS THERE IN e.message.
    }
  };

  const handleConnectSocial = (provider: string) => {
    // The popup must open synchronously inside the click gesture, otherwise
    // the browser blocks it. The SocialsOnboarding page picks the session up.
    beginSocialLogin(provider, store.config.appId);

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

      <div className="">
        {orderedLoginMethods.map((method, index) => {
          const normalizeMethod = (m?: string) =>
            String(m || '').toLowerCase().trim();
          const socialProvider = normalizeMethod(method);
          const nextMethod = orderedLoginMethods[index + 1];
          const walletExists = orderedLoginMethods.includes('wallet');
          // Rows that are rendered as non-wallet login options. A divider
          // separates the wallet block from those rows on either side.
          const isAuthRow = (m?: string) =>
            m === 'email' || enabledSocials.includes(normalizeMethod(m));
          const shouldRenderDivider =
            (walletExists &&
              !store.showAllWallets &&
              method === 'wallet' &&
              isAuthRow(nextMethod)) ||
            (walletExists && isAuthRow(method) && nextMethod === 'wallet');

          if (method === 'wallet') {
            return (
              <React.Fragment key="wallet">
                <div className="bluxcc:max-h-81 bluxcc:space-y-2 bluxcc:overflow-y-auto overflowStyle">
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
            enabledSocials.includes(socialProvider)
          ) {
            // Render only the first occurrence of a provider so duplicate
            // entries in loginMethods don't produce duplicate buttons.
            const firstIndex = orderedLoginMethods.findIndex(
              (m) => normalizeMethod(m) === socialProvider,
            );

            if (firstIndex !== index) {
              return null;
            }

            const providerMeta = SOCIAL_PROVIDERS[socialProvider];

            return (
              <React.Fragment key={socialProvider}>
                <div className="bluxcc:mb-2">
                  <CardItem
                    label={t('continueWith', {
                      provider: providerMeta.displayName,
                    })}
                    startIcon={<CDNImage name={providerMeta.icon} />}
                    onClick={() => handleConnectSocial(socialProvider)}
                  />
                </div>

                {shouldRenderDivider && renderDivider()}
              </React.Fragment>
            );
          }

          if (!store.showAllWallets && method === 'email') {
            return (
              <React.Fragment key="email">
                {
                  <>
                    <CardItem
                      inputType="email"
                      variant="input"
                      startIcon={
                        <CDNImage
                          name={CDNFiles.SmallEmail}
                          props={{ fill: appearance.textColor }}
                        />
                      }
                      onChange={(value: string) => setInputValue(value)}
                      onEnter={handleConnectEmail}
                      onSubmit={handleConnectEmail}
                    />

                    {shouldRenderDivider && renderDivider()}
                  </>
                }
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

      <footer
        className={`bluxcc:w-full bluxcc:pt-4.25 bluxcc:text-center bluxcc:text-xs bluxcc:font-medium`}
      >
        <a
          aria-label="blux website"
          href="https://blux.cc"
          target="_blank"
          rel="noreferrer"
          className="bluxcc:no-underline"
          style={{
            color: appearance.textColor,
            fontFamily: appearance.fontFamily,
          }}
        >
          {t('poweredByBlux')}
        </a>
      </footer>
    </div>
  );
};

export default Onboarding;
