import { JSX } from "react";

import { Route } from "../enums";
import Waiting from "../pages/Waiting";
import { LanguageKey } from "./locales";
import Successful from "../pages/Successful";
import Onboarding from "../pages/Onboarding";
import { translate } from "../utils/helpers";

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
  // [Route.PROFILE]: {
  //   title: translate('profile', lang),
  //   Component: <Profile />,
  // },
  [Route.WAITING]: {
    title: "",
    Component: <Waiting />,
  },
  [Route.SUCCESSFUL]: {
    title: "",
    Component: <Successful />,
  },
  // [Route.SIGN_TRANSACTION]: {
  //   title: translate('confirmation', lang),
  //   Component: <SignTransaction />,
  // },
  // [Route.SEND]: {
  //   title: translate('send', lang),
  //   Component: <Send />,
  // },
  // [Route.ACTIVITY]: {
  //   title: translate('activity', lang),
  //   Component: <Activity />,
  // },
  // [Route.OTP]: {
  //   title: '',
  //   Component: <ConfirmCode />,
  // },
  // [Route.WRONG_NETWORK]: {
  //   isSticky: true,
  //   title: translate('wrongNetwork', lang),
  //   Component: <WrongNetwork />,
  // },
});
