import { useAppStore } from "../../../store";
import TabBox from "../../../components/TabBox";
import { AssetsIcon } from "../../../assets/Icons";
import Assets from "../../../components/AssetsList";
import { StellarLogo } from "../../../assets/Logos";
import { balanceToAsset } from "../../../utils/helpers";

const Balances = () => {
  const appearance = useAppStore((store) => store.config.appearance);
  const { loading, error, balances } = useAppStore((store) => store.balances);

  const assets = balances.map((b) => ({
    ...balanceToAsset(b),
    logo: <StellarLogo />,
  }));

  const tabsContent = [
    {
      label: "Assets",
      activeIcon: <AssetsIcon fill={appearance.accentColor} />,
      inActiveIcon: <AssetsIcon fill={appearance.textColor} />,
      content: <Assets assets={assets} />,
    },
    // TODO: implement tokens and nft in the future
    // {
    //   label: "Tokens",
    //   activeIcon: <TokenIcon fill={appearance.accentColor} />,
    //   inActiveIcon: <TokenIcon fill={appearance.textColor} />,
    //   content: (
    //     <>
    //       <Assets assets={mockAssets} />
    //       <div className="bluxcc:absolute bluxcc:bottom-3 bluxcc:flex bluxcc:items-center bluxcc:justify-center">
    //         {/* <Button
    //           size="large"
    //           state="enabled"
    //           variant="tonal"
    //           style={{
    //             color: appearance.accentColor,
    //           }}
    //           endIcon={<PlusIcon fill={appearance.accentColor} />}
    //         >
    //           Add new token
    //         </Button> */}
    //       </div>
    //     </>
    //   ),
    // },
    //
    // {
    //   label: "NFTs",
    //   activeIcon: <NFTsIcon fill={appearance.accentColor} />,
    //   inActiveIcon: <NFTsIcon fill={appearance.textColor} />,
    //   content: "nfts",
    // },
  ];

  if (loading) {
    return "Loading";
  }

  if (error) {
    return "Error, try again.";
  }

  return <TabBox tabs={tabsContent} />;
};

export default Balances;
