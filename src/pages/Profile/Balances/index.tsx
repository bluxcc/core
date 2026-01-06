import { useAppStore } from '../../../store';
import TabBox from '../../../components/TabBox';
import { useLang } from '../../../hooks/useLang';
import { AssetsIcon } from '../../../assets/Icons';
import Assets from '../../../components/AssetsList';
import { StellarLogo } from '../../../assets/Logos';
import {
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
    logo: <StellarLogo />,
    title: getAssetTitle(b),
    subtitle: getAssetSubtitle(b),
  }));

  // const { setRoute } = useAppStore((store) => store);
  // const handleAddToken = () => {
  //   setRoute(Route.ADD_TOKEN);
  // };

  const tabsContent = [
    {
      label: t('assets'),
      activeIcon: <AssetsIcon fill={appearance.accentColor} />,
      inActiveIcon: <AssetsIcon fill={appearance.textColor} />,
      content: <Assets assets={assets} />,
    },
    // {
    //   label: t("tokens"),
    //   activeIcon: <TokenIcon fill={appearance.accentColor} />,
    //   inActiveIcon: <TokenIcon fill={appearance.textColor} />,
    //   content: (
    //     <div className="bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:flex-col bluxcc:w-full bluxcc:relative">
    //       <Assets assets={mockAssets} />
    //       <div className="bluxcc:absolute bluxcc:bottom-3">
    //         <Button
    //           size="large"
    //           state="enabled"
    //           variant="tonal"
    //           onClick={handleAddToken}
    //           style={{
    //             color: appearance.accentColor,
    //           }}
    //           startIcon={<PlusIcon fill={appearance.accentColor} />}
    //         >
    //           {t("add_new_token")}
    //         </Button>
    //       </div>
    //     </div>
    //   ),
    // },
    // {
    //   label: t("nfts"),
    //   activeIcon: <NFTsIcon fill={appearance.accentColor} />,
    //   inActiveIcon: <NFTsIcon fill={appearance.textColor} />,
    //   content: "nfts",
    // },
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
