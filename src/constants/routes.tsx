import { JSX } from "react";

import { Route } from "../enums";
import Profile from "../pages/Profile";
import Waiting from "../pages/Waiting";
import { LanguageKey } from "../types";
import Swap from "../pages/Profile/Swap";
import Send from "../pages/Profile/Send";
import OTP from "../pages/Onboarding/OTP";
import Successful from "../pages/Successful";
import Onboarding from "../pages/Onboarding";
import { translate } from "../utils/helpers";
import Receive from "../pages/Profile/Receive";
import WrongNetwork from "../pages/WrongNetwork";
import Balances from "../pages/Profile/Balances";
import Activity from "../pages/Profile/Activity";
import SendTransaction from "../pages/SendTransaction";
import BalanceDetails from "../pages/Profile/Balances/BalanceDetails";
import About from "../pages/About";
import AddToken from "../pages/Profile/Balances/AddToken";
import SignMessage from "../pages/SignMessage";
import Failed from "../pages/Failed";
import WalletConnect from "../pages/WalletConnect";

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
  [Route.FAILED]: {
    title: "",
    Component: <Failed />,
  },
  [Route.SEND_TRANSACTION]: {
    title: translate("confirmation", lang),
    Component: <SendTransaction />,
  },
  [Route.SEND]: {
    title: translate("send", lang),
    Component: <Send />,
  },
  [Route.ACTIVITY]: {
    title: translate("activity", lang),
    Component: <Activity />,
  },

  [Route.RECEIVE]: {
    title: translate("receive", lang),
    Component: <Receive />,
  },
  [Route.SWAP]: {
    title: translate("swap", lang),
    Component: <Swap />,
  },
  [Route.BALANCES]: {
    title: translate("balances", lang),
    Component: <Balances />,
  },
  [Route.BALANCE_DETAILS]: {
    title: "",
    Component: <BalanceDetails />,
  },
  [Route.OTP]: {
    title: "",
    Component: <OTP />,
  },
  [Route.WRONG_NETWORK]: {
    isSticky: true,
    title: "",
    Component: <WrongNetwork />,
  },
  [Route.ABOUT]: {
    title: "What is Blux",
    Component: <About />,
  },
  [Route.ADD_TOKEN]: {
    title: "Add Token",
    Component: <AddToken />,
  },
  [Route.SIGN_MESSAGE]: {
    title: "Sign Message",
    Component: <SignMessage />,
  },
  [Route.WALLET_CONNECT]: {
    title: "Wallet Connect",
    Component: <WalletConnect />,
  },
});
