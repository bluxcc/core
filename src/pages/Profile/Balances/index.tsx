import { IAsset } from "../../../types";
import { useAppStore } from "../../../store";
import TabBox from "../../../components/TabBox";
import { AssetsIcon } from "../../../assets/Icons";
import { StellarLogo } from "../../../assets/Logos";
import Assets from "../../../components/AssetsList";
import useBalances from "../../../hooks/useBalances";

const Balances = () => {
  const appearance = useAppStore((store) => store.config.appearance);
  const { loading, error, balances } = useBalances();

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

  const tabsContent = [
    {
      label: "Assets",
      activeIcon: <AssetsIcon fill={appearance.accentColor} />,
      inActiveIcon: <AssetsIcon fill={appearance.textColor} />,
      content: <Assets assets={mockAssets} />,
    },
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
