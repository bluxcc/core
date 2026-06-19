import { useAppStore } from '../../../store';
import { useLang } from '../../../hooks/useLang';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import Assets from '../../../components/AssetsList';
import { balanceLineKey } from '../../../utils/prices';
import {
  hexToRgba,
  getAssetTitle,
  balanceToAsset,
  getAssetSubtitle,
} from '../../../utils/helpers';

// Stellar classic has no on-chain marker that separates NFTs from regular
// assets (NFT-ness is only a convention: tiny fixed supply plus off-chain
// TOML/IPFS metadata), so everything is shown in a single list.
const Balances = () => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);
  const { loading, error, balances } = useAppStore((store) => store.balances);
  const balanceValues = useAppStore((store) => store.balanceValues);

  const assets = balances.map((b) => ({
    ...balanceToAsset(b),
    valueInCurrency: balanceValues[balanceLineKey(b)] ?? '0',
    title: getAssetTitle(b),
    subtitle: getAssetSubtitle(b),
    logo: <CDNImage name={CDNFiles.Stellar} props={{}} />,
  }));

  const NoAssets = () => {
    return (
      <div className="bluxcc:w-full bluxcc:mt-22 bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:flex-col bluxcc:gap-2">
        <CDNImage name={CDNFiles.GrayCube} props={{}} />

        <p
          className="bluxcc:font-medium"
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
        >
          {t('no_balance_message')}
        </p>
      </div>
    );
  };

  const StatusMessage = ({ text }: { text: string }) => (
    <div
      className="bluxcc:flex bluxcc:h-[355px] bluxcc:items-center bluxcc:justify-center bluxcc:text-center"
      style={{
        color: hexToRgba(appearance.textColor, 0.7),
        fontFamily: appearance.fontFamily,
      }}
    >
      {text}
    </div>
  );

  if (loading) {
    return <StatusMessage text={`${t('loading')}...`} />;
  }

  if (error) {
    return <StatusMessage text={t('errorTryAgain')} />;
  }

  return (
    <div className="bluxcc:h-[355px] bluxcc:py-3">
      {!balances.length ? <NoAssets /> : <Assets assets={assets} />}
    </div>
  );
};

export default Balances;
