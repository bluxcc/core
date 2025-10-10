import { ChangeEvent, useEffect, useState } from 'react';
import { HorizonServer } from '@stellar/stellar-sdk/lib/horizon/server';

import AssetBox from './AssetBox';
import { Route } from '../../../enums';
import { IAsset } from '../../../types';
import { useAppStore } from '../../../store';
import Button from '../../../components/Button';
import { useLang } from '../../../hooks/useLang';
import Divider from '../../../components/Divider';
import { sendTransaction } from '../../../exports/blux';
import { ArrowDropUp, SwapIcon } from '../../../assets/Icons';
import swapTransaction from '../../../stellar/swapTransaction';
import getStrictSendPaths from '../../../exports/core/getStrictSendPaths';
import getStrictReceivePaths from '../../../exports/core/getStrictReceivePaths';
import {
  hexToRgba,
  iAssetToAsset,
  humanizeAmount,
  balanceToAsset,
  isChangeTrustNeeded,
} from '../../../utils/helpers';

const Swap = () => {
  const t = useLang();
  const [to, setTo] = useState('0');
  const [from, setFrom] = useState('0');
  const store = useAppStore((store) => store);
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<IAsset[]>([]);
  const [error, setError] = useState({ field: '', message: '' });
  const [shouldCheckAgain, setShouldCheckAgain] = useState(false);
  const [rate, setRate] = useState({ rate: 0, isInverted: false });
  const [lastFieldChanged, setLastFieldChanged] = useState<'from' | 'to'>(
    'from',
  );

  const handleOpenAssets = (field: 'swapFrom' | 'swapTo') => {
    store.setSelectAsset({
      ...store.selectAsset,
      field: field,
    });

    store.setRoute(Route.SELECT_ASSET);
  };

  const handleInvertRate = () => {
    setRate({
      ...rate,
      isInverted: !rate.isInverted,
    });
  };

  const handleMax = () => {
    setLastFieldChanged('from');
    setShouldCheckAgain(!shouldCheckAgain);

    setFrom(store.selectAsset.swapFromAsset.assetBalance);
  };

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (error.message !== '') {
      return;
    }

    try {
      const isNeeded = isChangeTrustNeeded(
        to,
        store.selectAsset.swapToAsset,
        store.balances.balances,
      );

      const xdr = await swapTransaction(
        from,
        to,
        lastFieldChanged,
        store.selectAsset.swapFromAsset,
        store.selectAsset.swapToAsset,
        path,
        store.user?.address as string,
        store.stellar?.servers.horizon as HorizonServer,
        store.stellar?.activeNetwork || '',
        isNeeded,
      );

      setTimeout(() => {
        try {
          sendTransaction(xdr);
        } catch (e) { }
      }, 150);
    } catch {
      setError({ field: 'both', message: 'Failed to make transaction.' });
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: 'from' | 'to',
  ) => {
    if (field === 'from') {
      setFrom(e.target.value);
    } else {
      setTo(e.target.value);
    }

    setLastFieldChanged(field);
    setShouldCheckAgain(!shouldCheckAgain);
  };

  const cleanup = () => {
    setPath([]);
    setLoading(false);
    setError({ field: '', message: '' });
    setRate({ rate: 0, isInverted: false });
  };

  const handleSwapAssets = () => {
    const fromAsset = store.selectAsset.swapFromAsset;
    const toAsset = store.selectAsset.swapToAsset;

    store.setSelectAsset({
      ...store.selectAsset,
      swapFromAsset: toAsset,
      swapToAsset: fromAsset,
    });
  };

  const findSwapRoute = async () => {
    setLoading(true);

    if (lastFieldChanged === 'from') {
      try {
        const result = await getStrictSendPaths(
          [
            iAssetToAsset(store.selectAsset.swapFromAsset),
            from,
            [iAssetToAsset(store.selectAsset.swapToAsset)],
          ],
          {},
        );

        setLoading(false);

        if (result.response.records.length === 0) {
          setError({
            field: 'both',
            message: 'Could not find path. Try again.',
          });
        } else {
          const swapDetails = result.response.records[0];

          setRate({
            rate:
              Number(swapDetails.destination_amount) /
              Number(swapDetails.source_amount),
            isInverted: false,
          });
          setPath([
            store.selectAsset.swapFromAsset,
            // @ts-ignore
            ...swapDetails.path.map(balanceToAsset),
            store.selectAsset.swapToAsset,
          ]);
          setTo(swapDetails.destination_amount);
        }
      } catch {
        setLoading(false);
        setError({ field: 'both', message: 'Could not find path. Try again.' });
      }
    } else {
      try {
        const result = await getStrictReceivePaths(
          [
            [iAssetToAsset(store.selectAsset.swapFromAsset)],
            iAssetToAsset(store.selectAsset.swapToAsset),
            to,
          ],
          {},
        );

        setLoading(false);

        if (result.response.records.length === 0) {
          setError({
            field: 'both',
            message: 'Could not find path. Try again.',
          });
        } else {
          const swapDetails = result.response.records[0];

          setRate({
            rate:
              Number(swapDetails.destination_amount) /
              Number(swapDetails.source_amount),
            isInverted: false,
          });
          setPath([
            store.selectAsset.swapFromAsset,
            // @ts-ignore
            ...swapDetails.path.map(balanceToAsset),
            store.selectAsset.swapToAsset,
          ]);
          setFrom(swapDetails.source_amount);
        }
      } catch {
        setLoading(false);

        setError({ field: 'both', message: 'Could not find path. Try again.' });
      }
    }
  };

  useEffect(() => {
    cleanup();

    if (isNaN(Number(from)) || from === '' || Number(from) < 0) {
      setError({ field: 'from', message: 'Invalid value for FROM field.' });

      return;
    }

    if (isNaN(Number(to)) || to === '' || Number(to) < 0) {
      setError({ field: 'to', message: 'Invalid value for TO field.' });

      return;
    }

    if (
      store.selectAsset.swapFromAsset.assetCode ===
      store.selectAsset.swapToAsset.assetCode &&
      store.selectAsset.swapFromAsset.assetIssuer ===
      store.selectAsset.swapToAsset.assetIssuer
    ) {
      setError({ field: 'both', message: 'FROM and TO assets are the same.' });

      return;
    }

    if (isNaN(Number(store.selectAsset.swapFromAsset.assetBalance))) {
      setError({ field: 'from', message: 'FROM asset has invalid balance.' });

      return;
    }

    if (Number(from) > Number(store.selectAsset.swapFromAsset.assetBalance)) {
      setError({ field: 'from', message: 'Insufficient balance.' });

      return;
    }

    if (Number(from) === 0 && Number(to) === 0) {
      return;
    }

    setError({ field: '', message: '' });

    findSwapRoute();
  }, [store.selectAsset, shouldCheckAgain]);

  const { appearance } = store.config;

  let rateText = '';

  if (rate.rate !== 0) {
    if (rate.isInverted) {
      rateText = `1 ${store.selectAsset.swapToAsset.assetCode} = ${(1 / rate.rate).toFixed(5)} ${store.selectAsset.swapFromAsset.assetCode}`;
    } else {
      rateText = `1 ${store.selectAsset.swapFromAsset.assetCode} = ${humanizeAmount(rate.rate)} ${store.selectAsset.swapToAsset.assetCode}`;
    }
  }

  let minimumReceived = '';
  let isFromValid =
    from !== '' && from !== '0' && Number(from) >= 0 && !isNaN(Number(from));
  let isToValid =
    to !== '' && to !== '0' && Number(to) >= 0 && !isNaN(Number(to));

  if (isFromValid && isToValid && !loading) {
    minimumReceived = `${((Number(to) / 100) * 99.5).toFixed(5)} ${store.selectAsset.swapToAsset.assetCode}`;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:text-center">
        <div
          className="bluxcc:relative bluxcc:w-full bluxcc:p-4"
          style={{
            backgroundColor: appearance.fieldBackground,
            borderColor: appearance.borderColor,
            borderRadius: appearance.borderRadius,
            borderWidth: appearance.borderWidth,
          }}
        >
          <div className="bluxcc:flex bluxcc:justify-between bluxcc:text-sm">
            <span style={{ color: hexToRgba(appearance.textColor, 0.7) }}>
              From
            </span>
            <span className="bluxcc:cursor-pointer">
              {humanizeAmount(store.selectAsset.swapFromAsset.assetBalance)}{' '}
              <span
                onClick={handleMax}
                style={{ color: appearance.accentColor }}
                className="bluxcc:mr-2 bluxcc:inline-flex bluxcc:cursor-pointer"
              >
                {t('max')} <ArrowDropUp fill={appearance.accentColor} />
              </span>
            </span>
          </div>
          <div className="bluxcc:mt-2 bluxcc:flex bluxcc:items-center bluxcc:justify-between">
            <input
              name="from"
              type="number"
              value={from}
              onChange={(e) => {
                handleInputChange(e, 'from');
              }}
              id="bluxcc-input"
              className="bluxcc:w-full bluxcc:bg-transparent bluxcc:text-xl bluxcc:font-medium bluxcc:outline-none"
              style={{
                color:
                  error.field === 'from' || error.field === 'both'
                    ? '#ec2929'
                    : appearance.textColor,
              }}
            />
            <AssetBox
              asset={store.selectAsset.swapFromAsset}
              handleOpenAssets={() => {
                handleOpenAssets('swapFrom');
              }}
            />
          </div>
          {/* Todo: add estimated value here */}
          <div
            className="bluxcc:mt-1 bluxcc:text-left bluxcc:text-xs"
            style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          >
            {/*
            ≈ $23.74 USD
          */}
          </div>
          {/* Swap Icon */}
          <div className="bluxcc:flex bluxcc:h-8 bluxcc:w-full bluxcc:items-center bluxcc:justify-center cursor-pointer">
            <div
              className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0"
              style={{
                borderTopWidth: appearance.borderWidth,
                borderTopStyle: 'solid',
                borderTopColor: appearance.borderColor,
              }}
            />

            <div
              onClick={handleSwapAssets}
              className="bluxcc:z-20 bluxcc:p-2 bluxcc:cursor-pointer"
              style={{
                backgroundColor: appearance.fieldBackground,
                borderColor: appearance.borderColor,
                borderRadius: appearance.borderRadius,
                borderWidth: appearance.borderWidth,
              }}
            >
              <SwapIcon fill={appearance.accentColor} />
            </div>
          </div>
          {/* To Input */}

          <div className="bluxcc:flex bluxcc:justify-between bluxcc:text-sm">
            <span style={{ color: hexToRgba(appearance.textColor, 0.7) }}>
              To
            </span>
          </div>
          <div className="bluxcc:mt-2 bluxcc:flex bluxcc:items-center bluxcc:justify-between">
            <input
              name="to"
              id="bluxcc-input"
              type="number"
              value={to}
              onChange={(e) => {
                handleInputChange(e, 'to');
              }}
              className="bluxcc:w-full bluxcc:bg-transparent bluxcc:text-xl bluxcc:font-medium bluxcc:outline-none"
              style={{
                color:
                  error.field === 'to' || error.field === 'both'
                    ? '#ec2929'
                    : appearance.textColor,
              }}
            />

            <AssetBox
              asset={store.selectAsset.swapToAsset}
              handleOpenAssets={() => {
                handleOpenAssets('swapTo');
              }}
            />
          </div>
        </div>
        {!loading && rate.rate !== 0 && isToValid && (
          <p>
            {rateText}{' '}
            <button onClick={handleInvertRate} type="button">
              Invert
            </button>
          </p>
        )}

        {!loading && isToValid && <p>Minimum received: {minimumReceived}</p>}

        {loading ? (
          <p>LOADING...</p>
        ) : (
          <div>{path.map((x) => x.assetCode).join(' > ')}</div>
        )}

        <div className="bluxcc:h-4 bluxcc:w-full bluxcc:my-2 bluxcc:ml-3 bluxcc:text-left bluxcc:text-xs bluxcc:text-alert-error">
          {error.message}
        </div>

        <Divider />

        <Button
          size="large"
          state="enabled"
          variant="outline"
          type="submit"
          disabled={error.message !== ''}
        >
          Swap
        </Button>
      </div>
    </form>
  );
};

export default Swap;
