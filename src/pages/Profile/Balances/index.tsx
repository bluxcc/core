import { useAppStore } from '../../../store';
import { useLang } from '../../../hooks/useLang';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import Assets from '../../../components/AssetsList';
import { balanceLineKey } from '../../../utils/prices';
import TokensList from '../../../components/TokensList';
import { apiNetworkSlug } from '../../../utils/customTokens';
import {
  hexToRgba,
  getAssetTitle,
  balanceToAsset,
  getAssetSubtitle,
} from '../../../utils/helpers';

// Stellar classic has no on-chain marker that separates NFTs from regular
// assets (NFT-ness is only a convention: tiny fixed supply plus off-chain
// TOML/IPFS metadata), so the Assets tab shows everything in one list. The
// Tokens tab lists the user's custom SAC/SEP-41 tokens. (NFTs are intentionally
// not implemented.)
const Balances = () => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);
  const { loading, error, balances } = useAppStore((store) => store.balances);
  const balanceValues = useAppStore((store) => store.balanceValues);
  const activeNetwork = useAppStore((store) => store.stellar?.activeNetwork);
  const customTokens = useAppStore((store) => store.customTokens);
  const balancesTab = useAppStore((store) => store.balancesTab);
  const setBalancesTab = useAppStore((store) => store.setBalancesTab);

  const assets = balances.map((b) => ({
    ...balanceToAsset(b),
    valueInCurrency: balanceValues[balanceLineKey(b)] ?? '0',
    title: getAssetTitle(b),
    subtitle: getAssetSubtitle(b),
  }));

  const tokens = customTokens[apiNetworkSlug(activeNetwork)] ?? [];

  const tabs = [
    { key: 'assets' as const, label: t('assets'), icon: CDNFiles.Assets },
    { key: 'tokens' as const, label: t('tokens'), icon: CDNFiles.Token },
  ];

  const NoAssets = () => (
    <div className="bluxcc:w-full bluxcc:flex bluxcc:h-full bluxcc:justify-center bluxcc:items-center bluxcc:flex-col bluxcc:gap-2">
      <CDNImage name={CDNFiles.GrayCube} props={{}} />

      <p
        className="bluxcc:font-medium"
        style={{ color: hexToRgba(appearance.textColor, 0.7) }}
      >
        {t('no_balance_message')}
      </p>
    </div>
  );

  const StatusMessage = ({ text }: { text: string }) => (
    <div
      className="bluxcc:flex bluxcc:h-full bluxcc:items-center bluxcc:justify-center bluxcc:text-center"
      style={{
        color: hexToRgba(appearance.textColor, 0.7),
        fontFamily: appearance.fontFamily,
      }}
    >
      {text}
    </div>
  );

  const renderAssets = () => {
    if (loading) {
      return <StatusMessage text={`${t('loading')}...`} />;
    }

    if (error) {
      return <StatusMessage text={t('errorTryAgain')} />;
    }

    return !balances.length ? <NoAssets /> : <Assets assets={assets} />;
  };

  return (
    <div style={{ fontFamily: appearance.fontFamily }}>
      <div className="bluxcc:flex bluxcc:gap-3 bluxcc:py-3">
        {tabs.map((tab) => {
          const isActive = balancesTab === tab.key;

          return (
            <button
              key={tab.key}
              role="tab"
              id="bluxcc-button"
              aria-label={tab.label}
              aria-selected={isActive}
              onClick={() => setBalancesTab(tab.key)}
              className="bluxcc:flex bluxcc:h-20 bluxcc:flex-1 bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:gap-2 bluxcc:py-4 bluxcc:text-sm bluxcc:font-medium bluxcc:transition-all bluxcc:duration-300"
              style={{
                background: isActive
                  ? hexToRgba(appearance.accentColor, 0.1)
                  : appearance.background,
                color: isActive ? appearance.accentColor : appearance.textColor,
                borderRadius: appearance.borderRadius,
              }}
            >
              <CDNImage
                name={tab.icon}
                props={{
                  fill: isActive ? appearance.accentColor : appearance.textColor,
                }}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bluxcc:h-[320px] bluxcc:py-1" role="tabpanel">
        {balancesTab === 'assets' ? renderAssets() : <TokensList tokens={tokens} />}
      </div>
    </div>
  );
};

export default Balances;
