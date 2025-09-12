import { useEffect, useState, useRef } from "react";

import { Route } from "../../enums";
import { IWallet } from "../../types";
import { useAppStore } from "../../store";
import Button from "../../components/Button";
import { useLang } from "../../hooks/useLang";
import handleLogos from "../../utils/walletLogos";
import { Loading, RedExclamation } from "../../assets/Icons";
import handleTransactionSigning from "../../stellar/handleTransactionSigning";
import {
  getWalletNetwork,
  isBackgroundDark,
  setRecentConnectionMethod,
} from "../../utils/helpers";

const Waiting = () => {
  const t = useLang();
  const hasConnected = useRef(false);
  const [error, setError] = useState(false);
  const [matchedWallet, setMatchedWallet] = useState<IWallet | null>(null);

  const store = useAppStore((store) => store);

  const { user, wallets, connectWalletSuccessful, setRoute } = store;

  const waitingStatus = store.waitingStatus;
  const appearance = store.config.appearance;

  useEffect(() => {
    if (!user || !user.authValue) return;

    const foundWallet = wallets.find((w) => w.name === user.authValue);

    if (foundWallet) setMatchedWallet(foundWallet);
  }, [wallets, user]);

  useEffect(() => {
    if (!hasConnected.current && matchedWallet) {
      hasConnected.current = true;

      handleAssignment(matchedWallet);
    }
  }, [matchedWallet]);

  const handleAssignment = async (wallet: IWallet) => {
    if (waitingStatus === "sendTransaction") {
      try {
        const { sendTransaction, user, sendTransactionSuccessful } = store;

        if (!sendTransaction) {
          return;
        }

        if (!user) {
          return;
        }

        const result = await handleTransactionSigning(
          wallet,
          sendTransaction.xdr,
          user.address,
          sendTransaction.options,
          store.config.transports || {},
        );

        sendTransactionSuccessful({
          result,
          xdr: sendTransaction.xdr,
          options: sendTransaction.options,
          rejecter: sendTransaction.rejecter,
          resolver: sendTransaction.resolver,
        });
      } catch (error) {
        setError(true);

        throw error;
      }
    } else {
      try {
        const { publicKey } = await wallet.connect();

        if (publicKey && publicKey.trim() !== "") {
          const passphrase = await getWalletNetwork(wallet);

          connectWalletSuccessful(publicKey, passphrase);

          setRecentConnectionMethod(wallet.name);

          setTimeout(() => {
            setRoute(Route.SUCCESSFUL);
          }, 400);
        }
      } catch (error) {
        setError(true);

        throw error;
      }
    }
  };

  const handleRetry = () => {
    setError(false);

    if (matchedWallet) handleAssignment(matchedWallet);
  };

  if (!user) {
    return "ERROR";
  }

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      {error ? (
        <div
          className={`bluxcc:mb-6 bluxcc:flex bluxcc:items-center bluxcc:justify-center`}
        >
          <RedExclamation />
        </div>
      ) : (
        <div
          className={`bluxcc:mb-6 bluxcc:flex bluxcc:size-20 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full bluxcc:border`}
          style={{
            borderColor: appearance.borderColor,
            borderWidth: appearance.borderWidth,
          }}
        >
          {handleLogos(
            user.authValue ?? "",
            isBackgroundDark(appearance.background),
          )}
        </div>
      )}

      <div className="bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl">
          {error
            ? waitingStatus === "login"
              ? t("loginFailed")
              : t("signingFailed", {
                walletName: user.authValue ?? "wallet",
              })
            : waitingStatus === "login"
              ? t("waitingFor", { walletName: user.authValue ?? "wallet" })
              : t("signingWith", {
                walletName: user.authValue ?? "wallet",
              })}
        </p>
        <p className="bluxcc:text-sm">
          {error
            ? waitingStatus === "login"
              ? t("loginRetryMessage")
              : t("signingRetryMessage")
            : waitingStatus === "login"
              ? t("acceptConnection")
              : t("signRequestInWallet")}
        </p>
      </div>

      <div className="bluxcc:flex bluxcc:h-8 bluxcc:w-full bluxcc:items-center bluxcc:justify-center">
        <div
          className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0"
          style={{
            borderTopWidth: appearance.borderWidth,
            borderTopColor: appearance.borderColor,
          }}
        />
      </div>

      {error ? (
        <Button onClick={handleRetry} state="enabled" variant="outline">
          {t("tryAgain")}
        </Button>
      ) : (
        <Button
          state="enabled"
          variant="outline"
          className="bluxcc:cursor-default!"
          startIcon={<Loading fill={appearance.accentColor} />}
        >
          {waitingStatus === "login" ? t("connecting") : t("signing")}
        </Button>
      )}
    </div>
  );
};

export default Waiting;
