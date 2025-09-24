import { useAppStore } from "../../store";
import Button from "../../components/Button";
import { useLang } from "../../hooks/useLang";
import { walletsConfig } from "../../wallets";
import Divider from "../../components/Divider";
import { RedExclamation } from "../../assets/Icons";
import signMessageProcess from "../../stellar/processes/signMessageProcess";
import connectWalletProcess from "../../stellar/processes/connectWalletProcess";
import sendTransactionProcess from "../../stellar/processes/sendTransactionProcess";

const Failed = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const handleRetry = () => {
    if (store.waitingStatus === "signMessage") {
      signMessageProcess(store);
    } else if (store.waitingStatus === "sendTransaction") {
      sendTransactionProcess(store);
    } else if (store.waitingStatus === "login") {
      connectWalletProcess(
        store,
        // @ts-ignore
        walletsConfig[store.user?.authValue || "Rabet"],
      );
    }
  };

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div
        className={`bluxcc:mb-6 bluxcc:flex bluxcc:items-center bluxcc:justify-center`}
      >
        <RedExclamation />
      </div>

      <div className="bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl">
          {store.waitingStatus === "login"
            ? t("loginFailed")
            : t("signingFailed", {
              walletName: store.user?.authValue ?? "wallet",
            })}
        </p>

        <p className="bluxcc:text-sm">
          {store.waitingStatus === "login"
            ? t("loginRetryMessage")
            : t("signingRetryMessage")}
        </p>
      </div>

      <Divider />

      <Button onClick={handleRetry} state="enabled" variant="outline">
        {t("tryAgain")}
      </Button>
    </div>
  );
};

export default Failed;
