import React, { useState, useMemo, useEffect } from 'react';

import { IWallet } from '../../types';
import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import { StellarLogo } from '../../assets/Logos';
import CardItem from '../../components/CardItem';
import handleLogos from '../../utils/walletLogos';
import { SmallEmailIcon } from '../../assets/Icons';
import { Route, SupportedWallet } from '../../enums';
import { getContrastColor, isBackgroundDark } from '../../utils/helpers';
import connectWalletProcess from '../../stellar/processes/connectWalletProcess';
import { generateWalletConnectSession } from '../../utils/initializeWalletConnect';

const Onboarding = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const [inputValue, setInputValue] = useState('');

  const { config, wallets, connectEmail, setShowAllWallets } = store;
  const { appearance } = config;
  const loginMethods = config.loginMethods || [];

  const isPassKeyEnabled = loginMethods.includes('passkey');

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

  const handleConnectEmail = () => {
    connectEmail(inputValue);
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
            className="bluxcc:max-h-[80px] bluxcc:max-w-[180px] bluxcc:select-none"
            loading="eager"
            decoding="async"
            draggable="false"
            style={{ contentVisibility: 'auto' }}
          />
        </div>
      )}

      <div className="">
        {orderedLoginMethods.map((method, index) => {
          const nextMethod = orderedLoginMethods[index + 1];
          const prevMethod = orderedLoginMethods[index - 1];
          const walletExists = orderedLoginMethods.includes('wallet');
          const shouldRenderDivider =
            (walletExists &&
              !store.showAllWallets &&
              method === 'wallet' &&
              nextMethod === 'email') ||
            (walletExists && method === 'email' && prevMethod !== 'wallet');

          if (method === 'wallet') {
            return (
              <React.Fragment key="wallet">
                <div className="bluxcc:max-h-[324px] bluxcc:space-y-2 bluxcc:overflow-y-auto overflowStyle">
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
                        <StellarLogo
                          fill={getContrastColor(appearance.fieldBackground)}
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

          if (!store.showAllWallets && method === 'email') {
            return (
              <React.Fragment key="email">
                {
                  <>
                    <CardItem
                      inputType="email"
                      variant="input"
                      startIcon={<SmallEmailIcon fill={appearance.textColor} />}
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
                className="bluxcc:mt-6! bluxcc:bg-transparent bluxcc:flex bluxcc:h-4 bluxcc:items-center bluxcc:justify-center bluxcc:text-sm bluxcc:leading-7 bluxcc:font-medium"
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
        className={`bluxcc:w-full bluxcc:pt-[17px] bluxcc:text-center bluxcc:text-xs bluxcc:font-medium`}
      >
        <a
          aria-label="blux website"
          href="https://blux.cc"
          target="_blank"
          rel="noreferrer"
          className="bluxcc:no-underline"
          style={{
            color: appearance.textColor,
            font: appearance.fontFamily,
          }}
        >
          {t('poweredByBlux')}
        </a>
      </footer>
    </div>
  );
};

export default Onboarding;
