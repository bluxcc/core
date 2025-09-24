import { useAppStore } from "../../store";
import { Loading } from "../../assets/Icons";
import Button from "../../components/Button";
import { useLang } from "../../hooks/useLang";
import Divider from "../../components/Divider";
import handleLogos from "../../utils/walletLogos";
import { isBackgroundDark } from "../../utils/helpers";

const Waiting = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const { user } = store;

  const waitingStatus = store.waitingStatus;
  const appearance = store.config.appearance;

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div
        className={`bluxcc:mb-6 bluxcc:flex bluxcc:size-20 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full bluxcc:border`}
        style={{
          borderColor: appearance.borderColor,
          borderWidth: appearance.borderWidth,
        }}
      >
        {handleLogos(
          user?.authValue ?? "",
          isBackgroundDark(appearance.background),
        )}
      </div>

      <div className="bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl">
          {waitingStatus === "login"
            ? t("waitingFor", { walletName: user?.authValue ?? "wallet" })
            : t("signingWith", {
                walletName: user?.authValue ?? "wallet",
              })}
        </p>
        <p className="bluxcc:text-sm">
          {waitingStatus === "login"
            ? t("acceptConnection")
            : t("signRequestInWallet")}
        </p>
      </div>

      <Divider />

      <Button
        state="enabled"
        variant="outline"
        className="bluxcc:cursor-default!"
        startIcon={<Loading fill={appearance.accentColor} />}
      >
        {waitingStatus === "login" ? t("connecting") : t("signing")}
      </Button>
    </div>
  );
};

export default Waiting;
