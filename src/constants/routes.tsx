import { JSX } from 'react';

import { Route } from '../enums';
import Profile from '../pages/Profile';
import Waiting from '../pages/Waiting';
import Swap from '../pages/Profile/Swap';
import Send from '../pages/Profile/Send';
import OTP from '../pages/Onboarding/OTP';
import Successful from '../pages/Successful';
import Onboarding from '../pages/Onboarding';
import Receive from '../pages/Profile/Receive';
import WrongNetwork from '../pages/WrongNetwork';
import Balances from '../pages/Profile/Balances';
import Activity from '../pages/Profile/Activity';
import SendTransaction from '../pages/SendTransaction';
import BalanceDetails from '../pages/Profile/Balances/BalanceDetails';
import About from '../pages/About';
import AddToken from '../pages/Profile/Balances/AddToken';
import SignMessage from '../pages/SignMessage';
import Failed from '../pages/Failed';
import WalletConnect from '../pages/WalletConnect';
import SelectAsset from '../pages/Profile/SelectAsset';

type IRoute = {
  title?: string;
  Component: JSX.Element;
};

export const getModalContent = (): Record<string, IRoute> => {
  return {
    [Route.ONBOARDING]: {
      title: 'logInOrSignUp',
      Component: <Onboarding />,
    },
    [Route.PROFILE]: {
      title: 'profile',
      Component: <Profile />,
    },
    [Route.WAITING]: {
      title: '',
      Component: <Waiting />,
    },
    [Route.SUCCESSFUL]: {
      title: '',
      Component: <Successful />,
    },
    [Route.FAILED]: {
      title: '',
      Component: <Failed />,
    },
    [Route.SEND_TRANSACTION]: {
      title: 'confirmation',
      Component: <SendTransaction />,
    },
    [Route.SEND]: {
      title: 'send',
      Component: <Send />,
    },
    [Route.ACTIVITY]: {
      title: 'activity',
      Component: <Activity />,
    },

    [Route.RECEIVE]: {
      title: 'receive',
      Component: <Receive />,
    },
    [Route.SWAP]: {
      title: 'swap',
      Component: <Swap />,
    },
    [Route.BALANCES]: {
      title: 'balances',
      Component: <Balances />,
    },
    [Route.BALANCE_DETAILS]: {
      title: '',
      Component: <BalanceDetails />,
    },
    [Route.OTP]: {
      title: '',
      Component: <OTP />,
    },
    [Route.WRONG_NETWORK]: {
      title: '',
      Component: <WrongNetwork />,
    },
    [Route.ABOUT]: {
      title: 'whatIsBlux',
      Component: <About />,
    },
    [Route.ADD_TOKEN]: {
      title: 'addToken',
      Component: <AddToken />,
    },
    [Route.SIGN_MESSAGE]: {
      title: 'signMessage',
      Component: <SignMessage />,
    },
    [Route.SELECT_ASSET]: {
      title: 'selectAsset',
      Component: <SelectAsset />,
    },
    [Route.WALLET_CONNECT]: {
      title: 'walletConnect',
      Component: <WalletConnect />,
    },
  };
};
