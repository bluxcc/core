import { useAppStore } from "../../store";
import Button from "../../components/Button";
import { useLang } from "../../hooks/useLang";
import { useBalance } from "../../../useStellar";
import { Route, SupportedWallet } from "../../enums";
import {
  hexToRgba,
  humanizeAmount,
  getActiveNetworkTitle,
  shortenAddress,
} from "../../utils/helpers";
import Summary from "../../components/Transaction/Summary";
import getTransactionDetails from "../../stellar/getTransactionDetails";

const SignTransaction = () => {
  const t = useLang();
  const { balance } = useBalance({ asset: "native" });

  const store = useAppStore((store) => store);

  const appearance = store.config.appearance;
  const { signTransaction } = store;

  if (!signTransaction) {
    return (
      <div>
        <p>{t("invalidXdr")}</p>
      </div>
    );
  }

  const { xdr, options } = signTransaction;

  const txDetails = getTransactionDetails(xdr, options.network);

  const handleSignTx = async () => {
    // context.setValue((prev) => ({
    //   ...prev,
    //   isModalOpen: true,
    //   waitingStatus: "signing",
    // }));
    //
    // context.setRoute(Routes.WAITING);
  };

  if (!txDetails) {
    return (
      <div>
        <p>{t("invalidXdr")}</p>
      </div>
    );
  }

  if (!store.user) {
    return (
      <div>
        <p>{t("invalidXdr")}</p>
      </div>
    );
  }

  const networkTitle = getActiveNetworkTitle(store.stellar.activeNetwork);
  const isLobstr = store.user.authValue === SupportedWallet.Lobstr;

  return (
    <div className="bluxcc:w-full">
      <p className="bluxcc:mx-3 bluxcc:my-4 bluxcc:text-center bluxcc:text-sm bluxcc:font-medium bluxcc:select-none">
        <span className="bluxcc:font-semibold bluxcc:capitalize">
          {store.config.appName}{" "}
        </span>
        {t("signTransactionPrompt")}
      </p>

      <Summary
        operationsCount={txDetails.operations}
        sender={txDetails.sender}
        receiver={txDetails.receiver}
        network={options.network}
        estimatedFee={txDetails.estimatedFee.toString()}
        action={txDetails.action}
      />

      {isLobstr && (
        <p className="bluxcc:!my-2 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:text-center bluxcc:!text-xs bluxcc:text-alert-error">
          {t("lobstrWarning", { network: networkTitle })}
        </p>
      )}

      <div
        className="bluxcc:inline-flex bluxcc:h-14 bluxcc:w-full bluxcc:items-center bluxcc:justify-between bluxcc:border bluxcc:px-4"
        style={{
          marginTop: isLobstr ? "0px" : "16px",
          borderRadius: appearance.borderRadius,
          borderColor: appearance.borderColor,
        }}
      >
        <div className="bluxcc:inline-flex bluxcc:items-center bluxcc:gap-1 bluxcc:font-medium bluxcc:whitespace-nowrap">
          <p className="bluxcc:text-sm bluxcc:font-medium bluxcc:whitespace-nowrap">
            {t("yourWallet")}
          </p>
          <p
            className="bluxcc:mt-0.5 bluxcc:text-xs"
            style={{ color: `${hexToRgba(appearance.textColor, 0.8)}` }}
          >
            {store.user.address
              ? shortenAddress(store.user?.address as string, 5)
              : t("noAddressFound")}
          </p>
        </div>
        <div
          className="bluxcc:overflow-hidden bluxcc:px-[10px] bluxcc:py-2"
          style={{
            borderRadius: appearance.borderRadius,
            backgroundColor: appearance.fieldBackground,
            color: appearance.textColor,
          }}
        >
          <p className="bluxcc:max-w-[90px] bluxcc:text-xs bluxcc:font-normal">
            {balance ? humanizeAmount(balance) : "0"} XLM
          </p>
        </div>
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

      <Button
        size="large"
        state="enabled"
        variant="fill"
        onClick={handleSignTx}
      >
        {t("approve")}
      </Button>
    </div>
  );
};

export default SignTransaction;
