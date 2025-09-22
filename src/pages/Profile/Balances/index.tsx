import Assets from "../../../components/AssetsList";
import { IAsset } from "../../../types";
import TabBox from "../../../components/TabBox";
import {
  AssetsIcon,
  NFTsIcon,
  PlusIcon,
  TokenIcon,
} from "../../../assets/Icons";
import { useAppStore } from "../../../store";
import { StellarLogo } from "../../../assets/Logos";

import Button from "../../../components/Button";
import { Route } from "../../../enums";
import { useLang } from "../../../hooks/useLang";

const Balances = () => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);
  const { setRoute } = useAppStore((store) => store);

  const handleAddToken = () => {
    setRoute(Route.ADD_TOKEN);
  };
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
      label: t("assets"),
      activeIcon: <AssetsIcon fill={appearance.accentColor} />,
      inActiveIcon: <AssetsIcon fill={appearance.textColor} />,
      content: <Assets assets={mockAssets} />,
    },
    {
      label: t("tokens"),
      activeIcon: <TokenIcon fill={appearance.accentColor} />,
      inActiveIcon: <TokenIcon fill={appearance.textColor} />,
      content: (
        <div className="bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:flex-col bluxcc:w-full bluxcc:relative">
          <Assets assets={mockAssets} />
          <div className="bluxcc:absolute bluxcc:bottom-3">
            <Button
              size="large"
              state="enabled"
              variant="tonal"
              onClick={handleAddToken}
              style={{
                color: appearance.accentColor,
              }}
              startIcon={<PlusIcon fill={appearance.accentColor} />}
            >
              {t("add_new_token")}
            </Button>
          </div>
        </div>
      ),
    },

    {
      label: t("nfts"),
      activeIcon: <NFTsIcon fill={appearance.accentColor} />,
      inActiveIcon: <NFTsIcon fill={appearance.textColor} />,
      content: "nfts",
    },
  ];

  return <TabBox tabs={tabsContent} />;
};

export default Balances;
