import { useState } from 'react';

import { Route } from '../../enums';
import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import Divider from '../../components/Divider';
import CardItem from '../../components/CardItem';
import {
  Copy,
  Send,
  LogOut,
  History,
  OpenEye,
  SwapIcon,
  CloseEye,
  ReceiveIcon,
  BalancesIcon,
} from '../../assets/Icons';
import {
  copyText,
  hexToRgba,
  humanizeAmount,
  shortenAddress,
} from '../../utils/helpers';

const Profile = () => {
  const t = useLang();
  const [visible, setVisible] = useState(true);

  const store = useAppStore((store) => store);

  const { setRoute, logoutAction, setAlert } = store;
  const appearance = store.config.appearance;
  const address = store.user?.address as string;

  const handleLogout = () => {
    logoutAction();
  };

  const handleCopyAddress = () => {
    copyText(address)
      .then(() => {
        copyText(address);
        setAlert('info', 'Address Copied');
        setTimeout(() => {
          setAlert('none', '');
        }, 1000);
      })
      .catch(() => {});
  };

  const balance =
    store.balances.balances.length !== 0
      ? store.balances.balances.find((b) => b.asset_type === 'native')!.balance
      : '0';

  return (
    <div className="bluxcc:flex bluxcc:flex-col bluxcc:items-center bluxcc:justify-center">
      <div className="bluxcc:mt-4 bluxcc:mb-6 bluxcc:flex bluxcc:flex-col bluxcc:items-center bluxcc:justify-center">
        {/* <div
          className="bluxcc:size-[64px] bluxcc:rounded-full"
          style={{ background: appearance.accentColor }}
        /> */}
        <div
          className="bluxcc:text-center bluxcc:text-2xl bluxcc:h-8 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:gap-2"
          style={{ color: appearance.accentColor }}
        >
          <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-center">
            <p
              className="bluxcc:select-none"
              style={{
                verticalAlign: 'middle',
                paddingTop: !visible ? '8px' : '0px',
              }}
            >
              {balance
                ? visible
                  ? `${humanizeAmount(balance)} XLM`
                  : '******'
                : t('loading')}
            </p>
          </div>

          <div className="bluxcc:transition-all">
            {visible ? (
              <button
                id="bluxcc-button"
                onClick={() => setVisible(false)}
                className="bluxcc:bg-transparent"
              >
                <OpenEye fill={appearance.accentColor} />
              </button>
            ) : (
              <button
                id="bluxcc-button"
                onClick={() => setVisible(true)}
                className="bluxcc:bg-transparent"
              >
                <CloseEye fill={appearance.accentColor} />
              </button>
            )}
          </div>
        </div>
        <button
          id="bluxcc-button"
          className="bluxcc:mt-4! bluxcc:leading-4 bluxcc:inline-flex bluxcc:bg-transparent bluxcc:text-sm bluxcc:select-none"
          onClick={handleCopyAddress}
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
        >
          <span className="bluxcc:flex bluxcc:items-center bluxcc:gap-1">
            {address ? shortenAddress(address, 5) : ''}
            <Copy fill={hexToRgba(appearance.textColor, 0.7)} />
          </span>
        </button>
      </div>

      <div className="bluxcc:flex bluxcc:space-x-3">
        <CardItem
          size="small"
          label={t('send')}
          startIcon={<Send fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.SEND);
          }}
        />

        <CardItem
          size="small"
          label={t('receive')}
          startIcon={<ReceiveIcon fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.RECEIVE);
          }}
        />

        <CardItem
          size="small"
          label={t('swap')}
          startIcon={<SwapIcon fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.SWAP);
          }}
        />
      </div>
      <div className="bluxcc:mt-4 bluxcc:w-full bluxcc:space-y-2">
        <CardItem
          endArrow
          label={t('balances')}
          startIcon={<BalancesIcon fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.BALANCES);
          }}
        />

        <CardItem
          endArrow
          label={t('activity')}
          startIcon={<History fill={appearance.textColor} />}
          onClick={() => {
            setRoute(Route.ACTIVITY);
          }}
        />
      </div>

      <Divider />

      <button
        style={{
          color: hexToRgba(appearance.textColor, 0.9),
          fontFamily: appearance.fontFamily,
        }}
        onClick={handleLogout}
        className="bluxcc:flex bluxcc:h-12 bluxcc:font-medium bluxcc:text-base bluxcc:w-full bluxcc:bg-transparent bluxcc:items-center bluxcc:justify-center bluxcc:gap-2"
      >
        <LogOut fill={hexToRgba(appearance.textColor, 0.9)} />
        {t('logout')}
      </button>
    </div>
  );
};

export default Profile;
