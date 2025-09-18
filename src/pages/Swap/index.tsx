import { useState } from "react";
import Button from "../../components/Button";
import { hexToRgba } from "../../utils/helpers";
import { ArrowDropUp, SwapIcon } from "../../assets/Icons";

import { useLang } from "../../hooks/useLang";
import { IAsset } from "../../types";
import SelectAssets from "../SelectAsset";
import AssetBox from "./AssetBox";
import { useAppStore } from "../../store";
import Divider from "../../components/Divider";
import { StellarLogo } from "../../assets/Logos";

const mockAssets: IAsset[] = [
  {
    assetCode: "XLM",
    assetIssuer: "Stellar Foundation",
    assetType: "native",
    valueInCurrency: "10",
    assetBalance: "1000.1234",
    logo: <StellarLogo />,
  },
  {
    assetCode: "USDC",
    assetIssuer: "Centre Consortium",
    assetType: "credit_alphanum4",
    assetBalance: "500.5",
    valueInCurrency: "10",
    logo: <StellarLogo />,
  },
];
const Swap = () => {
  const [showSelectAssetPage, setShowSelectAssetPage] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<IAsset>(mockAssets[0]);

  const appearance = useAppStore((store) => store.config.appearance);
  const t = useLang();

  const handleOpenAssets = () => {
    setShowSelectAssetPage(true);
  };
  if (showSelectAssetPage) {
    return (
      <SelectAssets
        assets={mockAssets}
        setSelectedAsset={setSelectedAsset}
        setShowSelectAssetPage={setShowSelectAssetPage}
      />
    );
  }
  return (
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
            345.00{" "}
            <span
              style={{ color: appearance.accentColor }}
              className="bluxcc:mr-2 bluxcc:inline-flex bluxcc:cursor-pointer"
            >
              {t("max")} <ArrowDropUp fill={appearance.accentColor} />
            </span>
          </span>
        </div>
        <div className="bluxcc:mt-2 bluxcc:flex bluxcc:items-center bluxcc:justify-between">
          <input
            id="bluxcc-input"
            type="number"
            defaultValue={233}
            className="bluxcc:w-full bluxcc:bg-transparent bluxcc:text-xl bluxcc:font-medium bluxcc:outline-none"
            style={{ color: appearance.textColor }}
          />
          <AssetBox handleOpenAssets={handleOpenAssets} />
        </div>
        <div
          className="bluxcc:mt-1 bluxcc:text-left bluxcc:text-xs"
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
        >
          ≈ $23.74 USD
        </div>
        {/* Swap Icon */}
        <div className="bluxcc:flex bluxcc:h-8 bluxcc:w-full bluxcc:items-center bluxcc:justify-center">
          <div
            className="bluxcc:absolute bluxcc:right-0 bluxcc:left-0"
            style={{
              borderTopWidth: appearance.borderWidth,
              borderTopStyle: "solid",
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
            id="bluxcc-input"
            type="number"
            defaultValue={233}
            className="bluxcc:w-full bluxcc:bg-transparent bluxcc:text-xl bluxcc:font-medium bluxcc:outline-none"
            style={{ color: appearance.textColor }}
          />
          <AssetBox handleOpenAssets={handleOpenAssets} />
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
          <span
            className="bluxcc:h-2 bluxcc:w-2"
            style={{ backgroundColor: "#32D74B" }}
          ></span>
        </div>
      </div>
      <div
        className="bluxcc:ml-4 bluxcc:text-left bluxcc:text-xs"
        style={{ color: hexToRgba(appearance.textColor, 0.7) }}
      >
        The estimated effect of your swap on the market price.{" "}
        <span
          className="bluxcc:cursor-pointer bluxcc:rounded-full"
          style={{ color: appearance.accentColor }}
        >
          learn more
        </span>
      </div>

      <Divider appearance={appearance} />

      {/* Swap Button */}
      <Button size="large" state="enabled" variant="outline">
        Swap
      </Button>
    </div>
  );
};

export default Swap;
