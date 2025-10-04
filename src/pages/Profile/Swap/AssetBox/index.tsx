import { IAsset } from '../../../../types';
import { useAppStore } from '../../../../store';
import { StellarLogo } from '../../../../assets/Logos';
import { ArrowDropDown } from '../../../../assets/Icons';
import { getContrastColor } from '../../../../utils/helpers';

type AssetBoxProps = {
  asset: IAsset;
  handleOpenAssets: () => void;
};

const AssetBox = ({ handleOpenAssets, asset }: AssetBoxProps) => {
  const appearance = useAppStore((store) => store.config.appearance);

  return (
    <div
      onClick={handleOpenAssets}
      className="bluxcc:flex bluxcc:cursor-pointer bluxcc:items-center bluxcc:gap-1 bluxcc:p-1"
      style={{
        borderColor: appearance.borderColor,
        borderWidth: appearance.borderWidth,
        borderRadius: appearance.borderRadius,
        backgroundColor: appearance.fieldBackground,
      }}
    >
      <div
        style={{
          backgroundColor: appearance.background,
          borderRadius: appearance.borderRadius,
          borderColor: appearance.borderColor,
          borderWidth: appearance.borderWidth,
        }}
        className="bluxcc:flex bluxcc:size-10 bluxcc:shrink-0 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:transition-[border-radius] bluxcc:duration-300"
      >
        {asset.assetType === 'native' ? (
          <StellarLogo fill={getContrastColor(appearance.fieldBackground)} />
        ) : (
          <StellarLogo fill={getContrastColor(appearance.fieldBackground)} />
        )}
      </div>

      <span>{asset.assetCode}</span>

      <ArrowDropDown fill={appearance.accentColor} />
    </div>
  );
};

export default AssetBox;
