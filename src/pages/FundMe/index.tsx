import { Route } from '../../enums';
import { useAppStore } from '../../store';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';
import { hexToRgba } from '../../utils/helpers';

type IFundOption = {
  id: 'moonpay' | 'crypto';
  title: string;
  description: string;
  route?: Route;
  logo: CDNFiles;
  url?: string;
  disabled?: boolean;
};

function FundMe() {
  const store = useAppStore((state) => state);
  const { appearance } = store.config;
  const address = store.user?.address;

  const moonpayUrl = address
    ? `https://buy.moonpay.com?${new URLSearchParams({
        currencyCode: 'xlm',
        network: 'stellar',
        walletAddress: address,
      }).toString()}`
    : undefined;

  const fundOptions: IFundOption[] = [
    {
      id: 'moonpay',
      logo: CDNFiles.Globe,
      title: 'Moonpay',
      description: moonpayUrl
        ? 'Buy XLM instantly with card or bank transfer.'
        : 'Connect a wallet address to continue with MoonPay.',
      url: moonpayUrl,
      disabled: !moonpayUrl,
    },
    {
      id: 'crypto',
      logo: CDNFiles.Receive,
      title: 'Get fund by crypto',
      description: 'Receive XLM directly from another wallet.',
      route: Route.FUND_ME_CRYPTO,
    },
  ];

  const handleFundRoute = (f: IFundOption) => {
    if (f.disabled) {
      return;
    }

    if (f.url) {
      window.open(f.url, '_blank', 'noopener,noreferrer');
    } else if (f.route) {
      store.openModal(f.route);
    }
  };

  return (
    <div className="bluxcc:w-full bluxcc:space-y-3">
      <div
        className="bluxcc:space-y-1 bluxcc:px-4 bluxcc:py-3"
        style={{
          fontFamily: appearance.fontFamily,
          borderRadius: appearance.borderRadius,
          borderColor: appearance.borderColor,
          borderWidth: appearance.borderWidth,
          background: `linear-gradient(135deg, ${hexToRgba(
            appearance.accentColor,
            0.12,
          )}, ${appearance.fieldBackground})`,
        }}
      >
        <p
          className="bluxcc:text-base bluxcc:font-semibold bluxcc:leading-5 bluxcc:select-none"
          style={{ color: appearance.textColor }}
        >
          Top up your wallet
        </p>

        <p
          className="bluxcc:text-sm bluxcc:leading-4 bluxcc:select-none"
          style={{ color: hexToRgba(appearance.textColor, 0.72) }}
        >
          Choose a funding method to add XLM quickly and safely.
        </p>
      </div>

      <div className="bluxcc:space-y-2">
        {fundOptions.map((f) => (
          <button
            type="button"
            id="bluxcc-button"
            key={f.id}
            disabled={f.disabled}
            onClick={() => handleFundRoute(f)}
            className="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:gap-3 bluxcc:px-3 bluxcc:py-3 bluxcc:text-left bluxcc:transition-all bluxcc:duration-300"
            style={{
              opacity: f.disabled ? 0.65 : 1,
              fontFamily: appearance.fontFamily,
              borderRadius: appearance.borderRadius,
              borderColor: appearance.borderColor,
              borderWidth: appearance.borderWidth,
              backgroundColor: appearance.fieldBackground,
              color: appearance.textColor,
            }}
          >
            <span
              className="bluxcc:flex bluxcc:size-11 bluxcc:shrink-0 bluxcc:items-center bluxcc:justify-center bluxcc:rounded-xl"
              style={{
                background: hexToRgba(appearance.accentColor, 0.12),
              }}
            >
              <CDNImage name={f.logo} props={{ fill: appearance.accentColor }} />
            </span>

            <span className="bluxcc:flex bluxcc:min-w-0 bluxcc:flex-1 bluxcc:flex-col">
              <span className="bluxcc:text-base bluxcc:font-medium bluxcc:leading-5 bluxcc:select-none">
                {f.title}
              </span>
              <span
                className="bluxcc:text-sm bluxcc:leading-4 bluxcc:select-none"
                style={{ color: hexToRgba(appearance.textColor, 0.72) }}
              >
                {f.description}
              </span>
            </span>

            <span
              className="bluxcc:flex bluxcc:size-8 bluxcc:shrink-0 bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full"
              style={{ background: hexToRgba(appearance.textColor, 0.08) }}
            >
              <CDNImage
                name={CDNFiles.ArrowRight}
                props={{ fill: hexToRgba(appearance.textColor, 0.75) }}
              />
            </span>
          </button>
        ))}
      </div>

      <p
        className="bluxcc:px-1 bluxcc:text-xs bluxcc:leading-4 bluxcc:select-none"
        style={{
          fontFamily: appearance.fontFamily,
          color: hexToRgba(appearance.textColor, 0.62),
        }}
      >
        Third-party providers may charge separate fees based on payment
        method and region.
      </p>
    </div>
  );
}

export default FundMe;
