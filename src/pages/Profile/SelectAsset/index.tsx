import React, { useState, MouseEvent, ChangeEvent } from 'react';

import { IAsset } from '../../../types';
import { useAppStore } from '../../../store';
import { useLang } from '../../../hooks/useLang';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import { getSuggestedAssets } from '../../../constants/assets';
import {
  hexToRgba,
  shortenAddress,
  humanizeAmount,
  getContrastColor,
  addXLMToBalances,
  decideBackRouteFromSelectAsset,
} from '../../../utils/helpers';

const SelectAsset = () => {
  const t = useLang();
  const [isFocused, setIsFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const store = useAppStore((store) => store);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { appearance } = store.config;

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

  const ownedAssets = addXLMToBalances(defaultAssets);

  // Well-known assets (USDC, EURC) the user does not hold yet, offered as
  // swap destinations. The swap adds a changeTrust operation when needed.
  const suggestedAssets =
    store.selectAsset.field === 'swapTo'
      ? getSuggestedAssets(store.stellar?.activeNetwork || '').filter(
          (suggested) =>
            !ownedAssets.some(
              (owned) =>
                owned.assetCode === suggested.assetCode &&
                owned.assetIssuer === suggested.assetIssuer,
            ),
        )
      : [];

  const matchesQuery = (asset: IAsset) =>
    asset.assetCode.toLowerCase().includes(searchQuery.trim().toLowerCase());

  const assets = ownedAssets.filter(matchesQuery);
  const suggestions = suggestedAssets.filter(matchesQuery);

  const handleSelectAsset = (asset: IAsset) => {
    let fieldName = 'sendAsset';

    if (store.selectAsset.field === 'swapTo') {
      fieldName = 'swapToAsset';
    } else if (store.selectAsset.field === 'swapFrom') {
      fieldName = 'swapFromAsset';
    }

    store.setSelectAsset({
      ...store.selectAsset,
      [fieldName]: asset,
      userPicked: true,
    });

    const route = decideBackRouteFromSelectAsset(store.selectAsset.field);

    store.setRoute(route);
  };

  const onMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (!isFocused) {
      e.currentTarget.style.borderColor = appearance.accentColor;
      e.currentTarget.style.transition = 'border-color 0.35s ease-in-out';
    }
  };

  const onMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!isFocused) {
      e.currentTarget.style.borderColor = appearance.borderColor;
    }
  };

  const getBorderAndRingColor = () => {
    if (isFocused) return appearance.accentColor;
    return appearance.borderColor;
  };

  const renderAssetRow = (asset: IAsset, index: number, isLast: boolean) => (
    <button
      id="bluxcc-button"
      key={`${asset.assetCode}:${asset.assetIssuer}`}
      onClick={() => {
        handleSelectAsset(asset);
      }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      className="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:justify-between bluxcc:px-4 bluxcc:py-3"
      style={{
        background:
          hoveredIndex === index ? appearance.fieldBackground : 'transparent',
        color: appearance.textColor,
        borderBottomStyle: 'dashed',
        borderBottomWidth: isLast ? '0px' : appearance.borderWidth,
        borderBottomColor: appearance.borderColor,
        transition: 'all 0.2s ease-in-out',
        fontFamily: appearance.fontFamily,
      }}
    >
      <div className="bluxcc:flex bluxcc:items-center bluxcc:gap-2.5">
        <span
          className="bluxcc:font-medium bluxcc:size-10 bluxcc:flex bluxcc:items-center bluxcc:justify-center"
          style={{
            borderRadius: appearance.borderRadius,
            background: appearance.fieldBackground,
            border: `${appearance.borderWidth} solid ${appearance.borderColor}`,
          }}
        >
          {asset.assetType === 'native' ? (
            <CDNImage
              name={CDNFiles.Stellar}
              props={{
                fill: getContrastColor(appearance.fieldBackground),
              }}
            />
          ) : (
            <CDNImage
              name={CDNFiles.QuestionMark}
              props={{
                fill: getContrastColor(appearance.fieldBackground),
              }}
            />
          )}
        </span>
        <div className="bluxcc:flex bluxcc:flex-col bluxcc:items-start">
          <span className="bluxcc:text-sm bluxcc:font-medium">
            {asset.assetCode}
          </span>
          <span
            className="bluxcc:text-xs"
            style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          >
            {asset.assetType === 'native'
              ? 'native'
              : shortenAddress(asset.assetIssuer, 4)}
          </span>
        </div>
      </div>

      <span className="bluxcc:font-medium">
        {humanizeAmount(asset.assetBalance)}
      </span>
    </button>
  );

  return (
    <div className="bluxcc:h-[360px] bluxcc:w-full">
      <div>
        <div
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="bluxcc:flex bluxcc:h-14 bluxcc:items-center bluxcc:gap-2 bluxcc:p-4"
          style={
            {
              background: appearance.fieldBackground,
              borderWidth: appearance.borderWidth,
              '--tw-ring-color': getBorderAndRingColor(),
              borderRadius: appearance.borderRadius,
              borderColor: getBorderAndRingColor(),
              color: appearance.textColor,
            } as React.CSSProperties
          }
        >
          <CDNImage
            name={CDNFiles.Search}
            props={{ fill: appearance.textColor }}
          />

          <input
            autoFocus
            type="text"
            id="bluxcc-input"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="bluxcc:bg-transparent bluxcc:outline-hidden bluxcc:text-base"
            style={{
              fontFamily: appearance.fontFamily,
              color: appearance.textColor,
            }}
          />
        </div>
      </div>

      <div className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0 bluxcc:mt-4 bluxcc:gap-2 bluxcc:overflow-y-auto bluxcc:overflowStyle bluxcc:max-h-[300px]">
        {assets.map((asset, index) =>
          renderAssetRow(asset, index, index === assets.length - 1),
        )}

        {suggestions.length > 0 && (
          <>
            <div
              className="bluxcc:px-4 bluxcc:pt-3 bluxcc:pb-1 bluxcc:text-left bluxcc:text-xs bluxcc:font-medium bluxcc:select-none"
              style={{ color: hexToRgba(appearance.textColor, 0.7) }}
            >
              {t('popularAssets')}
            </div>

            {suggestions.map((asset, index) =>
              renderAssetRow(
                asset,
                assets.length + index,
                index === suggestions.length - 1,
              ),
            )}
          </>
        )}

        {assets.length === 0 && suggestions.length === 0 && (
          <div
            style={{ color: appearance.textColor }}
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
