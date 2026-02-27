import { useState } from 'react';

import { Route } from '../../enums';
import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import Divider from '../../components/Divider';
import { BluxEvent } from '../../utils/events';
import CardItem from '../../components/CardItem';
import CDNImage from '../../components/CDNImage';
import CDNFiles from '../../constants/cdnFiles';
import { clearRecentLoginConfig } from '../../utils/checkRecentLogins';
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

    clearRecentLoginConfig();

    store.emitter.emit(BluxEvent.Logout, undefined);
  };

  const handleCopyAddress = () => {
    copyText(address)
      .then(() => {
        copyText(address);
        setAlert('copy', 'Address Copied');
        setTimeout(() => {
          setAlert('none', '');
        }, 1000);
      })
      .catch(() => { });
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
          style={{
            color: appearance.accentColor,
            fontFamily: appearance.fontFamily,
          }}
        >
          <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-center">
            <p
              className="bluxcc:select-none"
              style={{
                verticalAlign: 'middle',
                paddingTop: !visible ? '8px' : '0px',
                fontFamily: appearance.fontFamily,
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
                <CDNImage
                  name={CDNFiles.OpenEye}
                  props={{ fill: appearance.accentColor }}
                />
              </button>
            ) : (
              <button
                id="bluxcc-button"
                onClick={() => setVisible(true)}
                className="bluxcc:bg-transparent"
              >
                <CDNImage
                  name={CDNFiles.CloseEye}
                  props={{ fill: appearance.accentColor }}
                />
              </button>
            )}
          </div>
        </div>
        <button
          id="bluxcc-button"
          className="bluxcc:mt-4! bluxcc:leading-4 bluxcc:inline-flex bluxcc:bg-transparent bluxcc:text-sm bluxcc:select-none"
          onClick={handleCopyAddress}
          style={{
            color: hexToRgba(appearance.textColor, 0.7),
            fontFamily: appearance.fontFamily,
          }}
        >
          <span className="bluxcc:flex bluxcc:items-center bluxcc:gap-1">
            {address ? shortenAddress(address, 5) : ''}
            <CDNImage
              name={CDNFiles.Copy}
              props={{ fill: hexToRgba(appearance.textColor, 0.7) }}
            />
          </span>
        </button>
      </div>

      <div className="bluxcc:flex bluxcc:space-x-3">
        <CardItem
          size="small"
          label={t('send')}
          startIcon={
            <CDNImage
              name={CDNFiles.Send}
              props={{ fill: appearance.textColor }}
            />
          }
          onClick={() => {
            setRoute(Route.SEND);
          }}
        />

        <CardItem
          size="small"
          label={t('receive')}
          startIcon={
            <CDNImage
              name={CDNFiles.Receive}
              props={{ fill: appearance.textColor }}
            />
          }
          onClick={() => {
            setRoute(Route.RECEIVE);
          }}
        />

        <CardItem
          size="small"
          label={t('swap')}
          startIcon={
            <CDNImage
              name={CDNFiles.Swap}
              props={{ fill: appearance.textColor }}
            />
          }
          onClick={() => {
            setRoute(Route.SWAP);
          }}
        />
      </div>
      <div className="bluxcc:mt-4 bluxcc:w-full bluxcc:space-y-2">
        <CardItem
          endArrow
          label={t('balances')}
          startIcon={
            <CDNImage
              name={CDNFiles.Balances}
              props={{ fill: appearance.textColor }}
            />
          }
          onClick={() => {
            setRoute(Route.BALANCES);
          }}
        />

        <CardItem
          endArrow
          label={t('activity')}
          startIcon={
            <CDNImage
              name={CDNFiles.History}
              props={{ fill: appearance.textColor }}
            />
          }
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
        <CDNImage
          name={CDNFiles.LogOut}
          props={{ fill: hexToRgba(appearance.textColor, 0.9) }}
        />
        {t('logout')}
      </button>
    </div>
  );
};

export default Profile;
