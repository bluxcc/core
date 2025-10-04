import { useEffect, useState } from 'react';

import AssetBox from './AssetBox';
import { Route } from '../../../enums';
import { IAsset } from '../../../types';
import { useAppStore } from '../../../store';
import Button from '../../../components/Button';
import { useLang } from '../../../hooks/useLang';
import Divider from '../../../components/Divider';
import { ArrowDropUp, SwapIcon } from '../../../assets/Icons';
import { hexToRgba, humanizeAmount } from '../../../utils/helpers';

const Swap = () => {
  const store = useAppStore((store) => store);
  const t = useLang();

  const [fromAsset, setFromAsset] = useState<IAsset>(store.selectAsset.asset);
  const [toAsset, setToAsset] = useState<IAsset>(store.selectAsset.asset);

  const handleOpenAssets = (field: 'swapFrom' | 'swapTo') => {
    store.setSelectAsset({
      ...store.selectAsset,
      for: field,
    });

    store.setRoute(Route.SELECT_ASSET);
  };

  const handleMax = () => {
    // dmskfjdkh
    // e.target.from.value = fromAsset.assetBalance;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // console.log(e.target.from.value);
    // console.log(e.target.to.value);
    // console.log(fromAsset);
    // console.log(toAsset);
  };

  useEffect(() => {
    const field = store.selectAsset.for;

    if (field === 'swapFrom') {
      setFromAsset(store.selectAsset.asset);
    } else {
      setToAsset(store.selectAsset.asset);
    }
  }, [store.selectAsset.asset]);

  const { appearance } = store.config;

  return (
    <form onSubmit={handleSubmit}>
      <div className="bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:text-center">
        <div
          className="bluxcc:relative bluxcc:mb-4 bluxcc:w-full bluxcc:p-4"
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
              {humanizeAmount(fromAsset.assetBalance)}{' '}
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
              id="bluxcc-input"
              type="number"
              defaultValue={0}
              className="bluxcc:w-full bluxcc:bg-transparent bluxcc:text-xl bluxcc:font-medium bluxcc:outline-none"
              style={{ color: appearance.textColor }}
            />
            <AssetBox
              asset={fromAsset}
              handleOpenAssets={() => {
                handleOpenAssets('swapFrom');
              }}
            />
          </div>
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
              className="bluxcc:z-20 bluxcc:p-2"
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
              defaultValue={0}
              className="bluxcc:w-full bluxcc:bg-transparent bluxcc:text-xl bluxcc:font-medium bluxcc:outline-none"
              style={{ color: appearance.textColor }}
            />

            <AssetBox
              asset={toAsset}
              handleOpenAssets={() => {
                handleOpenAssets('swapTo');
              }}
            />
          </div>
        </div>

        {/* Price Impact */}
        <div
          className="bluxcc:mb-2 bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:justify-between bluxcc:px-4 bluxcc:py-2 bluxcc:text-sm"
          style={{
            backgroundColor: appearance.fieldBackground,
            borderRadius: appearance.borderRadius,
            borderColor: appearance.borderColor,
            borderWidth: appearance.borderWidth,
          }}
        >
          <span>Price Impact</span>
          <div
            className="bluxcc:flex bluxcc:items-center bluxcc:gap-1 bluxcc:px-2.5 bluxcc:py-2"
            style={{
              backgroundColor: appearance.fieldBackground,
              borderRadius: appearance.borderRadius,
              borderColor: appearance.borderColor,
              borderWidth: appearance.borderWidth,
            }}
          >
            <span style={{ color: appearance.accentColor }}>%0.2</span>
            {/* this should change color based on the impact if its positive its green if not red or yellow */}
            <span
              className="bluxcc:h-2 bluxcc:w-2"
              style={{ backgroundColor: '#32D74B' }}
            />
          </div>
        </div>
        <div
          className="bluxcc:ml-4 bluxcc:text-left bluxcc:text-xs"
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
        >
          The estimated effect of your swap on the market price.{' '}
          <span
            className="bluxcc:cursor-pointer bluxcc:rounded-full"
            style={{ color: appearance.accentColor }}
          >
            learn more
          </span>
        </div>

        <Divider />

        <Button size="large" state="enabled" variant="outline" type="submit">
          Swap
        </Button>
      </div>
    </form>
  );
};

export default Swap;
