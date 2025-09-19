import Assets from "./Assets";
import { IAsset } from "../../../types";
import TabBox from "../../../components/TabBox";
import { TokenIcon } from "../../../assets/Icons";
import { StellarLogo } from "../../../assets/Logos";

const Balances = () => {
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
      icon: <TokenIcon />,
      content: <Assets assets={mockAssets} />,
    },
    {
      label: "Tokens",
      icon: <TokenIcon />,
      content: "token",
    },

    {
      label: "NFTs",
      icon: <TokenIcon />,
      content: "nfts",
    },
  ];

  return <TabBox tabs={tabsContent} />;
};

export default Balances;
