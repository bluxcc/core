import { IAsset } from '../../../../types';
import { useAppStore } from '../../../../store';
import { StellarLogo } from '../../../../assets/Logos';
import { ArrowDropDown, QuestionMark } from '../../../../assets/Icons';
import { getContrastColor } from '../../../../utils/helpers';

type AssetBoxProps = {
  asset: IAsset;
  handleOpenAssets: () => void;
};

const AssetBox = ({ handleOpenAssets, asset }: AssetBoxProps) => {
  const appearance = useAppStore((store) => store.config.appearance);

  return (
    <button
      id="bluxcc-button"
      onClick={handleOpenAssets}
      className="bluxcc:flex bluxcc:bg-transparent bluxcc:items-center bluxcc:gap-1 bluxcc:p-1 bluxcc:max-h-12"
      style={{
        borderColor: appearance.borderColor,
        borderWidth: appearance.borderWidth,
        borderRadius: appearance.borderRadius,
        backgroundColor: appearance.fieldBackground,
      }}
    >
      <div
        style={{
          background: appearance.background,
          borderRadius: appearance.borderRadius,
          borderColor: appearance.borderColor,
          borderWidth: appearance.borderWidth,
        }}
        className="bluxcc:flex bluxcc:size-10 bluxcc:shrink-0 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:transition-[border-radius] bluxcc:duration-300"
      >
        {asset.assetType === 'native' ? (
          <StellarLogo fill={getContrastColor(appearance.fieldBackground)} />
        ) : (
          <QuestionMark fill={getContrastColor(appearance.fieldBackground)} />
        )}
      </div>

      <span>{asset.assetCode}</span>

      <ArrowDropDown fill={appearance.accentColor} />
    </button>
  );
};

export default AssetBox;
