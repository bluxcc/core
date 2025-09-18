import { JSX } from "react";

import OTP from "../pages/OTP";
import { Route } from "../enums";
import Profile from "../pages/Profile";
import Waiting from "../pages/Waiting";
import { LanguageKey } from "../types";
import Successful from "../pages/Successful";
import Onboarding from "../pages/Onboarding";
import { translate } from "../utils/helpers";
import WrongNetwork from "../pages/WrongNetwork";
import SendTransaction from "../pages/SendTransaction";
import Balances from "../pages/Balances";
import Swap from "../pages/Swap";
import Receive from "../pages/Receive";

type IRoute = {
  title: string;
  isSticky?: boolean;
  Component: JSX.Element;
};

export const getModalContent = (lang: LanguageKey): Record<string, IRoute> => ({
  [Route.ONBOARDING]: {
    title: translate("logInOrSignUp", lang),
    Component: <Onboarding />,
  },
  [Route.PROFILE]: {
    title: translate("profile", lang),
    Component: <Profile />,
  },
  [Route.WAITING]: {
    title: "",
    Component: <Waiting />,
  },
  [Route.SUCCESSFUL]: {
    title: "",
    Component: <Successful />,
  },
  [Route.SEND_TRANSACTION]: {
    title: translate("confirmation", lang),
    Component: <SendTransaction />,
  },
  // [Route.SEND]: {
  //   title: translate("send", lang),
  //   Component: <Send />,
  // },
  // [Route.ACTIVITY]: {
  //   title: translate('activity', lang),
  //   Component: <Activity />,
  // },

  [Route.RECEIVE]: {
    title: "Receive address",
    Component: <Receive />,
  },
  [Route.SWAP]: {
    title: "Swap",
    Component: <Swap />,
  },
  [Route.BALANCES]: {
    title: "Balances",
    Component: <Balances />,
  },
  [Route.OTP]: {
    title: "",
    Component: <OTP />,
  },
  [Route.WRONG_NETWORK]: {
    isSticky: true,
    title: translate("wrongNetwork", lang),
    Component: <WrongNetwork />,
  },
});
