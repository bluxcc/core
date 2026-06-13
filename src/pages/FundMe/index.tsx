import { JSX } from 'react';

import { Route } from '../../enums';
import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';
import { hexToRgba } from '../../utils/helpers';
import CardItem from '../../components/CardItem';
import { MoonPayLogo, Terms } from '../../assets';

type IFundOption = {
  id: 'moonpay' | 'crypto';
  title: string;
  route?: Route;
  url?: string;
  logo?: CDNFiles;
  disabled?: boolean;
  logoElement?: JSX.Element;
};

function FundMe() {
  const t = useLang();
  const store = useAppStore((state) => state);
  const { appearance } = store.config;
  const address = store.user?.address;

  const moonpayUrl = address
    ? `https://buy.moonpay.com?${new URLSearchParams({
      currencyCode: 'xlm',
      network: 'stellar',
      walletAddress: address,
    }).toString()}`
    : undefined;

  const fundOptions: IFundOption[] = [
    {
      id: 'moonpay',
      logoElement: <MoonPayLogo />,
      title: 'Moonpay',
      url: moonpayUrl,
      disabled: !moonpayUrl,
    },
    {
      id: 'crypto',
      logo: CDNFiles.Receive,
      title: t('receiveFunds'),
      route: Route.FUND_ME_CRYPTO,
    },
  ];

  const handleFundRoute = (f: IFundOption) => {
    if (f.disabled) {
      return;
    }

    if (f.url) {
      window.open(f.url, '_blank', 'noopener,noreferrer');
    } else if (f.route) {
      store.openModal(f.route);
    }
  };

  return (
    <>
      <div className="bluxcc:space-y-2">
        <div className="bluxcc:flex bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:w-full">
          <div
            className="bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:mb-2 bluxcc:size-17 bluxcc:rounded-full"
            style={{
              background: hexToRgba(appearance.accentColor, 0.12),
            }}
          >
            {/* <CDNImage
                  name={CDNFiles.Shield}
                  props={{ fill: appearance.accentColor }}
                /> */}
            <Terms fill={appearance.accentColor} />
          </div>
          <div className="bluxcc:mb-8 bluxcc:w-2/3 bluxcc:text-center">
            <p
              className="bluxcc:text-base bluxcc:font-medium"
              style={{ color: hexToRgba(appearance.textColor, 0.7) }}
            >
              Choose how you’d like to fund your wallet.{' '}
            </p>
          </div>
        </div>

        {fundOptions.map((f) => (
          <CardItem
            key={f.id}
            // disabled={f.disabled}
            endArrow
            label={f.title}
            startIcon={
              f.logo ? (
                <CDNImage
                  // @ts-ignore
                  name={f.logo}
                  props={{
                    fill: appearance.accentColor,
                  }}
                />
              ) : (
                // todo: move moonpay to cdn
                <MoonPayLogo />
              )
            }
            onClick={() => handleFundRoute(f)}
          />
        ))}
      </div>
    </>
  );
}

export default FundMe;
