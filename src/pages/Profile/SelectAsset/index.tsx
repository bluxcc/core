import React, { useState, MouseEvent, ChangeEvent } from 'react';

import { IAsset } from '../../../types';
import { useAppStore } from '../../../store';
import { Search } from '../../../assets/Icons';
import { useLang } from '../../../hooks/useLang';
import {
  addXLMToBalances,
  humanizeAmount,
  decideBackRouteFromSelectAsset,
} from '../../../utils/helpers';

const SelectAsset = () => {
  const t = useLang();
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const store = useAppStore((store) => store);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const defaultAssets: IAsset[] = store.balances.balances
    .filter((x) => x.asset_type !== 'liquidity_pool_shares')
    .filter((x) => x.balance !== '0.0000000')
    .map((asset) => {
      if (asset.asset_type === 'native') {
        return {
          assetIssuer: '',
          assetCode: 'XLM',
          assetBalance: asset.balance,
          assetType: asset.asset_type,
        };
      } else {
        return {
          assetBalance: asset.balance,
          assetCode: asset.asset_code,
          assetType: asset.asset_type,
          assetIssuer: asset.asset_issuer,
        };
      }
    });

  const assets = addXLMToBalances(defaultAssets);

  const handleSelectAsset = (asset: IAsset) => {
    store.setSelectAsset({
      ...store.selectAsset,
      asset,
    });

    const route = decideBackRouteFromSelectAsset(store.selectAsset);

    store.setRoute(route);
  };

  const onMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (!isFocused) {
      e.currentTarget.style.borderColor = store.config.appearance.accentColor;
      e.currentTarget.style.transition = 'border-color 0.35s ease-in-out';
    }
  };

  const onMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!isFocused) {
      e.currentTarget.style.borderColor = store.config.appearance.borderColor;
    }
  };

  const getBorderAndRingColor = () => {
    if (isFocused) return store.config.appearance.accentColor;
    return store.config.appearance.borderColor;
  };

  // Todo
  // if (context.value.account.loading) {
  //   return <div>{t("loading")}</div>;
  // }

  return (
    <div className="bluxcc:h-[348px]">
      <div>
        <div
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="bluxcc:flex bluxcc:h-14 bluxcc:items-center bluxcc:gap-2 bluxcc:p-4"
          style={
            {
              background: store.config.appearance.fieldBackground,
              borderWidth: store.config.appearance.borderWidth,
              '--tw-ring-color': getBorderAndRingColor(),
              borderRadius: store.config.appearance.borderRadius,
              borderColor: getBorderAndRingColor(),
              color: store.config.appearance.textColor,
            } as React.CSSProperties
          }
        >
          <Search fill={store.config.appearance.textColor} />

          <input
            autoFocus
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="bluxcc:bg-transparent bluxcc:outline-hidden"
            style={{
              color: store.config.appearance.textColor,
            }}
          />
        </div>
      </div>

      <div className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0 bluxcc:mt-4 bluxcc:gap-2 bluxcc:overflow-y-auto">
        {assets.map((asset, index) => (
          <div
            key={asset.assetType + asset.assetIssuer}
            onClick={() => {
              handleSelectAsset(asset);
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="bluxcc:flex bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-between bluxcc:px-4 bluxcc:py-3"
            style={{
              background:
                hoveredIndex === index
                  ? store.config.appearance.fieldBackground
                  : 'transparent',
              color: store.config.appearance.textColor,
              borderBottomStyle: 'dashed',
              borderBottomWidth:
                index < assets.length - 1
                  ? store.config.appearance.borderWidth
                  : '0px',
              borderBottomColor: store.config.appearance.borderColor,
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <div className="bluxcc:flex bluxcc:items-center bluxcc:gap-[10px]">
              <span className="bluxcc:font-medium">{asset.logo}</span>
              <div className="bluxcc:flex bluxcc:flex-col">
                <span className="bluxcc:text-xs bluxcc:font-medium">
                  {asset.assetCode}
                </span>
                <span className="bluxcc:text-xs">{asset.assetCode}</span>
              </div>
            </div>

            <span className="bluxcc:font-medium">
              {humanizeAmount(asset.assetBalance)}
            </span>
          </div>
        ))}

        {assets.length === 0 && (
          <div
            style={{ color: store.config.appearance.textColor }}
            className="bluxcc:mt-2 bluxcc:text-center"
          >
            {t('noAssetsFound')}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectAsset;
