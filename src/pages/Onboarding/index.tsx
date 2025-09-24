import React, { useState, useMemo } from "react";

import { IWallet } from "../../types";
import { useAppStore } from "../../store";
import { useLang } from "../../hooks/useLang";
import { StellarLogo } from "../../assets/Logos";
import CardItem from "../../components/CardItem";
import handleLogos from "../../utils/walletLogos";
import { SmallEmailIcon } from "../../assets/Icons";
import { getContrastColor, isBackgroundDark } from "../../utils/helpers";
import connectWalletProcess from "../../stellar/processes/connectWalletProcess";

const Onboarding = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const [inputValue, setInputValue] = useState("");

  const { config, wallets, connectEmail, setShowAllWallets } = store;
  const { appearance } = config;
  const loginMethods = config.loginMethods || [];

  const isPassKeyEnabled = loginMethods.includes("passkey");

  const orderedLoginMethods = useMemo(() => {
    const methods = [...loginMethods].filter((method) => method !== "passkey");
    return [...methods, ...(isPassKeyEnabled ? ["passkey"] : [])];
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

  const handleConnect = async (wallet: IWallet) => {
    connectWalletProcess(store, wallet);
  };

  const handleConnectEmail = () => {
    connectEmail(inputValue);
  };

  const renderDivider = () => (
    <div className="bluxcc:my-1 bluxcc:flex bluxcc:h-8 bluxcc:w-full bluxcc:items-center bluxcc:justify-center">
      <div
        className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0 bluxcc:z-10"
        style={{
          borderTopWidth: appearance.borderWidth,
          borderTopStyle: "dashed",
          borderTopColor: appearance.borderColor,
        }}
      />

      <span
        className="bluxcc:z-20 bluxcc:w-auto bluxcc:px-2 bluxcc:text-sm bluxcc:font-medium bluxcc:select-none"
        style={{
          backgroundColor: appearance.background,
          color: appearance.borderColor,
        }}
      >
        {t("or")}
      </span>
    </div>
  );

  return (
    <div className="bluxcc:w-full">
      {appearance.logo && (
        <div className="bluxcc:my-6 bluxcc:flex bluxcc:max-h-[80px] bluxcc:w-full bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden">
          <img
            src={appearance.logo}
            alt={config.appName}
            width={152}
            height={60}
            className="bluxcc:max-h-[80px] bluxcc:max-w-[180px] bluxcc:select-none"
            loading="eager"
            decoding="async"
            draggable="false"
            style={{ contentVisibility: "auto" }}
          />
        </div>
      )}

      <div className="bluxcc:space-y-2">
        {orderedLoginMethods.map((method, index) => {
          const nextMethod = orderedLoginMethods[index + 1];
          const prevMethod = orderedLoginMethods[index - 1];
          const walletExists = orderedLoginMethods.includes("wallet");
          const shouldRenderDivider =
            (walletExists &&
              !store.showAllWallets &&
              method === "wallet" &&
              nextMethod === "email") ||
            (walletExists && method === "email" && prevMethod !== "wallet");

          if (method === "wallet") {
            return (
              <React.Fragment key="wallet">
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
                    label={t("allStellarWallets")}
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
              </React.Fragment>
            );
          }

          if (!store.showAllWallets && method === "email") {
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

          if (!store.showAllWallets && method === "passkey") {
            return (
              <div
                key="passkey"
                className="bluxcc:mt-6! bluxcc:flex bluxcc:h-4 bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-center bluxcc:text-sm bluxcc:leading-[28px] bluxcc:font-medium"
                style={{ color: appearance.accentColor }}
              >
                {t("logInWithPasskey")}
              </div>
            );
          }

          return null;
        })}
      </div>

      <footer
        className={`bluxcc:w-full bluxcc:cursor-pointer bluxcc:pt-[17px] bluxcc:text-center bluxcc:text-xs bluxcc:font-medium`}
      >
        <a
          aria-label="blux website"
          href="https://blux.cc"
          target="_blank"
          rel="noreferrer"
          className="bluxcc:no-underline"
          style={{
            color: appearance.textColor,
          }}
        >
          {t("poweredByBlux")}
        </a>
      </footer>
    </div>
  );
};

export default Onboarding;
