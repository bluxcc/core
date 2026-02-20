import { useAppStore } from '../../../store';
import TabBox from '../../../components/TabBox';
import { useLang } from '../../../hooks/useLang';
import CDNFiles from '../../../constants/cdnFiles';
import CDNImage from '../../../components/CDNImage';
import Assets from '../../../components/AssetsList';
import {
  hexToRgba,
  getAssetTitle,
  balanceToAsset,
  getAssetSubtitle,
} from '../../../utils/helpers';

const Balances = () => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);
  const { loading, error, balances } = useAppStore((store) => store.balances);

  const assets = balances.map((b) => ({
    ...balanceToAsset(b),
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

  const tabsContent = [
    {
      label: t('assets'),
      activeIcon: (
        <CDNImage
          name={CDNFiles.Assets}
          props={{ fill: appearance.accentColor }}
        />
      ),
      inActiveIcon: (
        <CDNImage
          name={CDNFiles.Assets}
          props={{ fill: appearance.textColor }}
        />
      ),
      content: !balances.length ? <NoAssets /> : <Assets assets={assets} />,
    },
    {
      label: t('tokens'),
      activeIcon: (
        <CDNImage
          name={CDNFiles.Token}
          props={{ fill: appearance.accentColor }}
        />
      ),
      inActiveIcon: (
        <CDNImage
          name={CDNFiles.Token}
          props={{ fill: appearance.textColor }}
        />
      ),
      content: (
        <NoAssets />
        // <div className="bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:flex-col bluxcc:w-full bluxcc:relative">
        //   <Assets assets={assets} />
        //   <div className="bluxcc:absolute bluxcc:bottom-3">
        //     <Button
        //       size="large"
        //       state="enabled"
        //       variant="tonal"
        //       onClick={handleAddToken}
        //       style={{
        //         color: appearance.accentColor,
        //       }}
        //       startIcon={<PlusIcon fill={appearance.accentColor} />}
        //     >
        //       {t('add_new_token')}
        //     </Button>
        //   </div>
        // </div>
      ),
    },
    {
      label: t('nfts'),
      activeIcon: (
        <CDNImage
          name={CDNFiles.NFTs}
          props={{ fill: appearance.accentColor }}
        />
      ),
      inActiveIcon: (
        <CDNImage name={CDNFiles.NFTs} props={{ fill: appearance.textColor }} />
      ),
      content: <NoAssets />,
    },
  ];

  if (loading) {
    return 'Loading';
  }

  if (error) {
    return 'Error, try again.';
  }

  return <TabBox tabs={tabsContent} />;
};

export default Balances;
