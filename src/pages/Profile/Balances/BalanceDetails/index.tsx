import { Copy } from '../../../../assets/Icons';
import { StellarLogo } from '../../../../assets/Logos';
import { useLang } from '../../../../hooks/useLang';
import { useAppStore } from '../../../../store';
import { hexToRgba, humanizeAmount } from '../../../../utils/helpers';

type DetailsProps = {
  label: string;
  value: string | number;
  copyable?: boolean;
  link?: boolean;
};

const BalanceDetails = () => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);
  // const { setDynamicTitle } = useAppStore((store) => store);

  let asset = {
    logo: <StellarLogo />,
    assetBalance: 0.43332,
    valueInCurrency: 203,
  };

  const details: DetailsProps[] = [
    { label: t('network'), value: 'Stellar', link: true },
    { label: t('address'), value: 'GFGE...MKLW', copyable: true },
    { label: t('market_cap'), value: '2.45M' },
    { label: t('total_volume'), value: 323 },
    { label: t('all_time_high'), value: 323 },
  ];

  return (
    <div>
      <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:gap-2 bluxcc:my-4">
        <div
          className="bluxcc:size-14 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full bluxcc:border"
          style={{
            borderColor: appearance.borderColor,
            borderWidth: appearance.borderWidth,
          }}
        >
          {asset.logo}
        </div>
        <div className="bluxcc:flex bluxcc:flex-col">
          <span
            className="bluxcc:text-2xl bluxcc:font-medium"
            style={{ color: appearance.accentColor }}
          >
            ${humanizeAmount(asset.valueInCurrency)}
          </span>
          <span
            className="bluxcc:text-sm bluxcc:font-medium"
            style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          >
            {humanizeAmount(asset.assetBalance)} XLM
          </span>
        </div>
      </div>

      <div className="bluxcc:space-y-1">
        {details.map((item, i) => {
          // setDynamicTitle(item.label);
          return (
            <div
              key={i}
              className="bluxcc:flex bluxcc:font-medium bluxcc:items-center bluxcc:justify-between bluxcc:text-xs bluxcc:h-8 bluxcc:px-4"
              style={{
                borderBottom:
                  i < details.length - 1
                    ? `${appearance.borderWidth} dashed ${appearance.borderColor}`
                    : 'none',
              }}
            >
              <span>{item.label}</span>
              <span
                className="bluxcc:flex bluxcc:items-center bluxcc:gap-1 bluxcc:text-xs"
                style={{
                  color:
                    item.copyable || item.link
                      ? appearance.accentColor
                      : hexToRgba(appearance.textColor, 0.7),
                }}
              >
                {item.link ? (
                  <a
                    href="#"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: appearance.accentColor,
                      fontFamily: appearance.fontFamily,
                    }}
                    className="bluxcc:no-underline"
                  >
                    {item.value}
                  </a>
                ) : (
                  item.value
                )}
                {item.copyable && <Copy fill={appearance.accentColor} />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BalanceDetails;
