import { useState } from "react";

import { IAsset } from "../../types";
import { store, useAppStore } from "../../store";
import { useLang } from "../../hooks/useLang";
import { hexToRgba, humanizeAmount } from "../../utils/helpers";
import { Route } from "../../enums";

type AssetsProps = {
  assets: IAsset[];
};

const Assets = ({ assets }: AssetsProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const appearance = useAppStore((store) => store.config.appearance);
  const { setRoute } = useAppStore((store) => store);
  const t = useLang();

  const handleClickAsset = () => {
    setRoute(Route.BALANCE_DETAILS);
  };

  return (
    <div className="bluxcc:w-full">
      {assets.map((asset, index) => (
        <div
          onClick={handleClickAsset}
          key={asset.assetType + asset.assetIssuer}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="bluxcc:flex bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-between bluxcc:py-2 bluxcc:w-full"
          style={{
            background:
              hoveredIndex === index
                ? appearance.fieldBackground
                : "transparent",
            color: appearance.textColor,
            borderBottomStyle: "dashed",
            borderBottomWidth:
              index < assets.length - 1 ? appearance.borderWidth : "0px",
            borderBottomColor: appearance.borderColor,
            transition: "all 0.2s ease-in-out",
          }}
        >
          <div className="bluxcc:flex bluxcc:items-center bluxcc:gap-[10px]">
            <span
              className="bluxcc:font-medium bluxcc:size-10 bluxcc:flex bluxcc:items-center bluxcc:justify-center"
              style={{
                borderStyle: "solid",
                borderWidth: appearance.borderWidth,
                borderColor: appearance.borderColor,
                borderRadius: appearance.borderRadius,
              }}
            >
              {asset.logo}
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
              {humanizeAmount(asset.valueInCurrency)}$
            </span>
          </div>
        </div>
      ))}

      {assets.length === 0 && (
        <div
          style={{ color: appearance.textColor }}
          className="bluxcc:mt-2 bluxcc:text-center"
        >
          {t("noAssetsFound")}
        </div>
      )}
    </div>
  );
};

export default Assets;
