import { useState } from 'react';

import { IAsset } from '../../types';
import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import {
  getContrastColor,
  hexToRgba,
  humanizeAmount,
} from '../../utils/helpers';
import { StellarLogo } from '../../assets/Logos';
import { QuestionMark } from '../../assets/Icons';

type AssetsProps = {
  assets: IAsset[];
};

const Assets = ({ assets }: AssetsProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const appearance = useAppStore((store) => store.config.appearance);
  const t = useLang();

  // TODO: Implement asset detail page
  // const { setRoute } = useAppStore((store) => store);
  // const handleClickAsset = () => {
  //   setRoute(Route.BALANCE_DETAILS);
  // };

  return (
    <div className="bluxcc:h-full bluxcc:w-full bluxcc:overflow-auto overflowStyle">
      {assets.map((asset, index) => (
        <div
          // onClick={handleClickAsset}
          key={asset.assetType + asset.assetIssuer}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="bluxcc:flex bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-between bluxcc:py-2 bluxcc:px-4"
          style={{
            background:
              hoveredIndex === index
                ? appearance.fieldBackground
                : 'transparent',
            color: appearance.textColor,
            borderBottomStyle: 'dashed',
            borderBottomWidth:
              index < assets.length - 1 ? appearance.borderWidth : '0px',
            borderBottomColor: appearance.borderColor,
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <div className=" bluxcc:flex bluxcc:items-center bluxcc:gap-[10px]">
            <span
              className="bluxcc:font-medium bluxcc:size-10 bluxcc:flex bluxcc:items-center bluxcc:justify-center"
              style={{
                borderRadius: appearance.borderRadius,
                background: appearance.fieldBackground,
                border: `${appearance.borderWidth} solid ${appearance.borderColor}`,
              }}
            >
              {asset.assetType === 'native' ? (
                <StellarLogo
                  fill={getContrastColor(appearance.fieldBackground)}
                />
              ) : (
                <QuestionMark
                  fill={getContrastColor(appearance.fieldBackground)}
                />
              )}
            </span>
            <div className="bluxcc:flex bluxcc:flex-col">
              <span className="bluxcc:text-sm bluxcc:font-medium">
                {asset.assetCode}
              </span>
              <span
                className="bluxcc:font-semibold bluxcc:text-xs"
                style={{ color: hexToRgba(appearance.textColor, 0.7) }}
              >
                {asset.assetCode}
              </span>
            </div>
          </div>

          <div className="bluxcc:flex bluxcc:flex-col bluxcc:text-right">
            <span className="bluxcc:font-medium">
              {humanizeAmount(asset.assetBalance)}
            </span>
            <span
              className="bluxcc:font-semibold bluxcc:text-xs"
              style={{ color: hexToRgba(appearance.textColor, 0.7) }}
            >
              {humanizeAmount(asset.valueInCurrency || '0')}$
            </span>
          </div>
        </div>
      ))}

      {assets.length === 0 && (
        <div
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          className="bluxcc:mb-2 bluxcc:text-center bluxcc:h-full bluxcc:flex bluxcc:justify-center bluxcc:items-center"
        >
          {t('noAssetsFound')}
        </div>
      )}
    </div>
  );
};

export default Assets;
