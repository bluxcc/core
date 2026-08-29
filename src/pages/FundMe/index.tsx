import { JSX, useEffect, useRef, useState } from 'react';

import { Route } from '../../enums';
import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';
import { hexToRgba } from '../../utils/helpers';
import CardItem from '../../components/CardItem';
import { getSigningWallet } from '../../wallets';
import { sendTransaction } from '../../exports/blux';
import signTransaction from '../../stellar/signTransaction';
import paymentTransaction from '../../stellar/paymentTransaction';
import {
  BuyIcon,
  SellIcon,
  MoneyGramLogo,
  MoonPayLogo,
  CurrencyExchange,
} from '../../assets';
import {
  assertHorizon,
  isMoneygramNetwork,
  moneygramUsdc,
  startMoneygramWithdraw,
  waitForMoneygramTransfer,
} from '../../stellar/moneygram';

type FundMode = 'onramp' | 'offramp';
type MoneygramStatus = 'idle' | 'starting' | 'waiting';

type IFundOption = {
  id: 'moonpay' | 'crypto' | 'moneygram';
  title: string;
  route?: Route;
  url?: string;
  logo?: CDNFiles;
  disabled?: boolean;
  logoElement?: JSX.Element;
  onClick?: () => void;
};

function FundMe() {
  const t = useLang();
  const store = useAppStore((state) => state);
  const { appearance } = store.config;
  const address = store.user?.address;
  const network = store.stellar?.activeNetwork || '';
  const [mode, setMode] = useState<FundMode>('onramp');
  const [moneygramStatus, setMoneygramStatus] =
    useState<MoneygramStatus>('idle');
  const moneygramAbort = useRef<AbortController | null>(null);

  const moonpayBuyUrl = address
    ? `https://buy.moonpay.com?${new URLSearchParams({
        currencyCode: 'xlm',
        network: 'stellar',
        walletAddress: address,
      }).toString()}`
    : undefined;

  const moonpaySellUrl = address
    ? `https://sell.moonpay.com?${new URLSearchParams({
        defaultBaseCurrencyCode: 'xlm',
      }).toString()}`
    : undefined;

  useEffect(() => {
    store.setDynamicTitle(mode === 'offramp' ? 'cashOut' : 'addFunds');
  }, [mode]);

  useEffect(() => {
    return () => {
      moneygramAbort.current?.abort();
      store.setDynamicTitle('');
    };
  }, []);

  const showError = (message: string) => {
    store.setAlert('error', message);
    setTimeout(() => {
      store.setAlert('none', '');
    }, 2500);
  };

  const cancelMoneygram = () => {
    moneygramAbort.current?.abort();
    moneygramAbort.current = null;
    setMoneygramStatus('idle');
  };

  const handleMoneygram = async () => {
    if (!address || moneygramStatus !== 'idle') {
      return;
    }

    const wallet = store.user
      ? getSigningWallet(store.user, store.wallets)
      : undefined;

    if (!wallet) {
      showError(t('moneygramError'));
      return;
    }

    const abort = new AbortController();

    moneygramAbort.current = abort;
    setMoneygramStatus('starting');

    try {
      const session = await startMoneygramWithdraw({
        address,
        network,
        lang: store.config.lang,
        signal: abort.signal,
        sign: (xdr) => signTransaction(wallet, xdr, address, network),
      });

      if (abort.signal.aborted) {
        return;
      }

      window.open(session.url, '_blank', 'noopener,noreferrer');
      setMoneygramStatus('waiting');

      const details = await waitForMoneygramTransfer(session, abort.signal);
      const xdr = await paymentTransaction(
        details.memo,
        details.amount,
        details.destination,
        moneygramUsdc(network),
        address,
        assertHorizon(store.stellar?.servers.horizon),
        network,
        details.memoType,
      );

      store.closeModal();

      setTimeout(() => {
        sendTransaction(xdr, { network });
      }, 400);
    } catch {
      if (abort.signal.aborted) {
        return;
      }

      showError(t('moneygramError'));
      setMoneygramStatus('idle');
    }
  };

  const onrampOptions: IFundOption[] = [
    {
      id: 'moonpay',
      logoElement: <MoonPayLogo />,
      title: 'MoonPay',
      url: moonpayBuyUrl,
      disabled: !moonpayBuyUrl,
    },
    {
      id: 'crypto',
      logo: CDNFiles.Receive,
      title: t('receiveFunds'),
      route: Route.FUND_ME_CRYPTO,
    },
  ];

  const offrampOptions: IFundOption[] = [
    {
      id: 'moonpay',
      logoElement: <MoonPayLogo />,
      title: 'MoonPay',
      url: moonpaySellUrl,
      disabled: !moonpaySellUrl,
    },
  ];

  if (isMoneygramNetwork(network)) {
    offrampOptions.push({
      id: 'moneygram',
      logoElement: <MoneyGramLogo />,
      title: 'MoneyGram',
      disabled: !address,
      onClick: handleMoneygram,
    });
  }

  const fundOptions = mode === 'onramp' ? onrampOptions : offrampOptions;

  const handleFundRoute = (f: IFundOption) => {
    if (f.disabled || moneygramStatus !== 'idle') {
      return;
    }

    if (f.onClick) {
      f.onClick();
      return;
    }

    if (f.url) {
      window.open(f.url, '_blank', 'noopener,noreferrer');
    } else if (f.route) {
      store.openModal(f.route);
    }
  };

  const tabs: {
    key: FundMode;
    label: string;
    Icon: ({ fill }: { fill?: string }) => JSX.Element;
  }[] = [
    { key: 'onramp', label: t('buy'), Icon: BuyIcon },
    { key: 'offramp', label: t('sell'), Icon: SellIcon },
  ];

  const waiting = moneygramStatus !== 'idle';

  return (
    <div className="bluxcc:space-y-2">
      <div className="bluxcc:flex bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:w-full">
        <div
          className="bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:mb-2 bluxcc:size-17 bluxcc:rounded-full"
          style={{
            background: hexToRgba(appearance.accentColor, 0.12),
          }}
        >
          <CurrencyExchange fill={appearance.accentColor} />
        </div>
        <div className="bluxcc:mb-8 bluxcc:w-2/3 bluxcc:text-center">
          <p
            className="bluxcc:text-base bluxcc:font-medium"
            style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          >
            {waiting
              ? moneygramStatus === 'starting'
                ? t('moneygramSignHelp')
                : t('moneygramWaitingHelp')
              : mode === 'onramp'
                ? t('fundMeOnrampHelp')
                : t('fundMeOfframpHelp')}
          </p>
        </div>
      </div>

      {!waiting && (
        <div className="bluxcc:flex bluxcc:gap-3 bluxcc:pb-3">
          {tabs.map((tab) => {
            const isActive = mode === tab.key;
            const Icon = tab.Icon;

            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                id="bluxcc-button"
                aria-label={tab.label}
                aria-selected={isActive}
                onClick={() => setMode(tab.key)}
                className="bluxcc:flex bluxcc:h-20 bluxcc:flex-1 bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:gap-2 bluxcc:py-4 bluxcc:text-sm bluxcc:font-medium bluxcc:transition-all bluxcc:duration-300"
                style={{
                  background: isActive
                    ? hexToRgba(appearance.accentColor, 0.1)
                    : appearance.background,
                  color: isActive
                    ? appearance.accentColor
                    : appearance.textColor,
                  borderRadius: appearance.borderRadius,
                }}
              >
                <Icon
                  fill={
                    isActive ? appearance.accentColor : appearance.textColor
                  }
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {waiting ? (
        <CardItem
          label={t('back')}
          startIcon={
            <CDNImage
              name={CDNFiles.ArrowLeft}
              props={{ fill: appearance.accentColor }}
            />
          }
          onClick={cancelMoneygram}
        />
      ) : (
        fundOptions.map((f) => (
          <CardItem
            key={f.id}
            endArrow
            label={f.title}
            startIcon={
              f.logoElement ??
              (f.logo ? (
                <CDNImage
                  name={f.logo}
                  props={{
                    fill: appearance.accentColor,
                  }}
                />
              ) : (
                <MoonPayLogo />
              ))
            }
            onClick={() => handleFundRoute(f)}
          />
        ))
      )}
    </div>
  );
}

export default FundMe;
