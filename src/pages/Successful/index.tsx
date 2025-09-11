import { useAppStore } from "../../store";
import Button from "../../components/Button";
import { useLang } from "../../hooks/useLang";
import { GreenCheck } from "../../assets/Icons";
import { networks } from "../../constants/networkDetails";
import { capitalizeFirstLetter, getExplorerUrl } from "../../utils/helpers";
import { useEffect } from "react";

const Successful = () => {
  const t = useLang();
  const config = useAppStore((store) => store.config);
  const closeModal = useAppStore((store) => store.closeModal);

  const { appearance } = config;

  // const { result, options } = context.value.signTransaction;
  const result = "dfkdhfkfdkdfh";
  const options = { isSoroban: false, network: networks.mainnet };
  const waitingStatus = "connecting";
  let hash = "fkdhfkdfkdhfkdfhkdfh";

  const explorerUrl = hash
    ? getExplorerUrl(options.network, config.explorer, "transactionUrl", hash)
    : null;

  useEffect(() => {
    // if (waitingStatus === "connecting") {
    //   setTimeout(() => {
    //     context.setValue((prev) => ({
    //       ...prev,
    //       isModalOpen: false,
    //       showAllWallets: false,
    //       isAuthenticated: true,
    //     }));
    //   }, 1000);
    // }
  }, []);

  const handleGoToExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDone = () => {
    closeModal();

    // if (waitingStatus === "signing") {
    //   const { resolver, result } = context.value.signTransaction;
    //
    //   if (resolver && result) {
    //     resolver(result);
    //   }
    // }
  };

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div className="bluxcc:mb-6 bluxcc:flex bluxcc:size-[68px] bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden">
        <GreenCheck />
      </div>

      <div className="bluxcc:w-full bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl">
          {waitingStatus === "connecting"
            ? t("connectionSuccessfulTitle")
            : t("transactionSuccessfulTitle")}
        </p>
        <p className="bluxcc:text-center bluxcc:text-sm bluxcc:leading-5">
          {waitingStatus === "connecting"
            ? t("connectionSuccessfulMessage", {
              appName: capitalizeFirstLetter(config.appName),
            })
            : t("transactionSuccessfulMessage")}
        </p>
      </div>

      {waitingStatus === "signing" &&
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

      {/* divider */}
      <div className="bluxcc:flex bluxcc:h-8 bluxcc:w-full bluxcc:items-center bluxcc:justify-center">
        <div
          className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0"
          style={{
            // borderTopWidth: appearance.includeBorders
            //   ? appearance.borderWidth
            //   : "1px",
            borderTopColor: appearance.borderColor,
          }}
        />
      </div>

      {waitingStatus === "connecting" ? (
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
