import { useEffect } from "react";

import { useAppStore } from "../../store";
import Button from "../../components/Button";
import { useLang } from "../../hooks/useLang";
import Divider from "../../components/Divider";
import { GreenCheck } from "../../assets/Icons";
import {
  capitalizeFirstLetter,
  getExplorerUrl,
  hexToRgba,
} from "../../utils/helpers";

const Successful = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const { config, closeModal, waitingStatus } = store;
  const { appearance } = config;

  const { sendTransaction } = store;

  const hash = sendTransaction?.result?.hash;
  const network = sendTransaction?.options?.network || "";

  const explorerUrl = hash
    ? getExplorerUrl(network, config.explorer, "transactionUrl", hash)
    : null;

  useEffect(() => {
    if (waitingStatus === "login") {
      setTimeout(() => {
        closeModal();
      }, 1000);
    }
  }, []);

  const handleGoToExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDone = () => {
    closeModal();

    if (waitingStatus === "sendTransaction") {
      if (!sendTransaction) {
        return;
      }

      const { resolver, result } = sendTransaction;

      if (resolver && result) {
        resolver(result);
      }
    }
  };

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div
        style={{ background: hexToRgba(appearance.accentColor, 0.1) }}
        className="bluxcc:mb-6 bluxcc:flex bluxcc:size-[68px] bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full"
      >
        <GreenCheck fill={appearance.accentColor} />
      </div>

      <div className="bluxcc:w-full bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl">
          {waitingStatus === "login"
            ? t("connectionSuccessfulTitle")
            : t("transactionSuccessfulTitle")}
        </p>
        <p className="bluxcc:text-center bluxcc:text-sm bluxcc:leading-5">
          {waitingStatus === "login"
            ? t("connectionSuccessfulMessage", {
                appName: capitalizeFirstLetter(config.appName),
              })
            : t("transactionSuccessfulMessage")}
        </p>
      </div>

      {waitingStatus === "sendTransaction" &&
        hash &&
        typeof explorerUrl == "string" && (
          <Button
            state="enabled"
            variant="outline"
            size="small"
            className="mt-4"
            onClick={handleGoToExplorer}
          >
            {t("seeInExplorer")}
          </Button>
        )}

      <Divider />

      {waitingStatus === "login" ? (
        <Button
          state="enabled"
          variant="outline"
          className="bluxcc:cursor-default!"
        >
          {t("loggingIn")}
        </Button>
      ) : (
        <Button
          state="enabled"
          variant="fill"
          size="large"
          onClick={handleDone}
        >
          {t("done")}
        </Button>
      )}
    </div>
  );
};

export default Successful;
