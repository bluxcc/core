import { useState } from "react";

import { Route } from "../../enums";
import { useAppStore } from "../../store";
import { useLang } from "../../hooks/useLang";
import CardItem from "../../components/CardItem";
import {
  Copy,
  Send,
  History,
  SwapIcon,
  ReceiveIcon,
  BalancesIcon,
  LogOut,
  OpenEye,
  CloseEye,
} from "../../assets/Icons";
import {
  copyText,
  hexToRgba,
  humanizeAmount,
  shortenAddress,
} from "../../utils/helpers";
import Divider from "../../components/Divider";

const Profile = () => {
  const t = useLang();
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);

  const store = useAppStore((store) => store);

  const { setRoute, logoutAction } = store;
  const appearance = store.config.appearance;
  const address = store.user?.address as string;

  const handleLogout = () => {
    logoutAction();
  };

  const handleCopyAddress = () => {
    copyText(address)
      .then(() => {
        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch(() => {});
  };

  // todo
  const balance = "0";
  // const balance = store.account
  //   ? store.account.balances.find((b) => b.asset_type === "native")?.balance
  //   : "0";

  return (
    <div className="bluxcc:flex bluxcc:flex-col bluxcc:items-center bluxcc:justify-center">
      <div className="bluxcc:mt-4 bluxcc:mb-6 bluxcc:flex bluxcc:flex-col bluxcc:items-center bluxcc:justify-center">
        {/* <div
          className="bluxcc:size-[64px] bluxcc:rounded-full"
          style={{ background: appearance.accentColor }}
        /> */}
        <div
          className="bluxcc:text-center bluxcc:text-2xl bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:gap-2"
          style={{ color: appearance.accentColor }}
        >
          <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-center">
            <p className="bluxcc:leading-none bluxcc:select-none bluxcc:align-middle">
              {balance
                ? visible
                  ? `${humanizeAmount(balance)} XLM`
                  : "******"
                : t("loading")}
            </p>
          </div>

          {visible ? (
            <div
              onClick={() => setVisible(false)}
              className="bluxcc:cursor-pointer"
            >
              <OpenEye fill={appearance.accentColor} />
            </div>
          ) : (
            <div
              onClick={() => setVisible(true)}
              className="bluxcc:cursor-pointer"
            >
              <CloseEye fill={appearance.accentColor} />
            </div>
          )}
        </div>
        <p
          className="bluxcc:!mt-4 bluxcc:leading-[16px] bluxcc:inline-flex bluxcc:cursor-pointer bluxcc:text-sm bluxcc:select-none"
          onClick={handleCopyAddress}
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
        >
          {copied ? (
            t("copied")
          ) : (
            <span className="bluxcc:flex bluxcc:items-center bluxcc:gap-1">
              {address ? shortenAddress(address, 5) : ""}
              <Copy fill={hexToRgba(appearance.textColor, 0.7)} />
            </span>
          )}
        </p>
      </div>

      <div className="bluxcc:flex bluxcc:space-x-3">
        <CardItem
          size="small"
          label={t("send")}
          startIcon={<Send fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.SEND);
          }}
        />
        <CardItem
          size="small"
          label={t("receive")}
          startIcon={<ReceiveIcon fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.RECEIVE);
          }}
        />
        <CardItem
          size="small"
          label={t("swap")}
          startIcon={<SwapIcon fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.SWAP);
          }}
        />
      </div>
      <div className="bluxcc:mt-[16px] bluxcc:w-full bluxcc:space-y-2">
        <CardItem
          endArrow
          label={t("balances")}
          startIcon={<BalancesIcon fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.BALANCES);
          }}
        />

        <CardItem
          endArrow
          label={t("activity")}
          startIcon={<History fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.ACTIVITY);
          }}
        />
      </div>

      <Divider appearance={appearance} />

      <div
        style={{ color: appearance.textColor }}
        onClick={handleLogout}
        className="bluxcc:flex bluxcc:h-12 bluxcc:w-full bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-center bluxcc:gap-2"
      >
        <LogOut fill={appearance.textColor} />
        {t("logout")}
      </div>
    </div>
  );
};

export default Profile;
