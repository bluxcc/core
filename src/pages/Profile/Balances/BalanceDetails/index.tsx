import { useEffect } from 'react';

import { Route } from '../../../../enums';
import { useAppStore } from '../../../../store';
import { useLang } from '../../../../hooks/useLang';
import CDNFiles from '../../../../constants/cdnFiles';
import CDNImage from '../../../../components/CDNImage';
import { DEFAULT_NETWORKS_TRANSPORTS } from '../../../../constants/networkDetails';
import {
  copyText,
  hexToRgba,
  shortenAddress,
  humanizeAmount,
  getExplorerUrl,
  getContrastColor,
} from '../../../../utils/helpers';

const BalanceDetails = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;

  const asset = store.detailsAsset;
  const activeNetwork = store.stellar?.activeNetwork || '';

  // The asset code is shown as the modal title; clear it when leaving.
  useEffect(() => {
    return () => {
      store.setDynamicTitle('');
    };
  }, []);

  useEffect(() => {
    if (!asset) {
      store.setRoute(Route.BALANCES);
    }
  }, [asset]);

  if (!asset) {
    return null;
  }

  const isNative = asset.assetType === 'native';
  const networkName =
    DEFAULT_NETWORKS_TRANSPORTS[activeNetwork]?.name || t('network');
  const issuerExplorerUrl = isNative
    ? null
    : getExplorerUrl(
        activeNetwork,
        store.config.explorer,
        'accountUrl',
        asset.assetIssuer,
      );

  const handleCopyIssuer = () => {
    copyText(asset.assetIssuer)
      .then(() => {
        store.setAlert('copy', t('address_copied'));

        setTimeout(() => {
          store.setAlert('none', '');
        }, 1000);
      })
      .catch(() => { });
  };

  const details = [
    { label: t('network'), value: <span>{networkName}</span> },
    ...(isNative || !asset.assetIssuer
      ? []
      : [
          {
            label: t('issuer'),
            value: (
              <span className="bluxcc:flex bluxcc:items-center bluxcc:gap-1">
                {issuerExplorerUrl ? (
                  <a
                    href={issuerExplorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bluxcc:no-underline"
                    style={{
                      color: appearance.accentColor,
                      fontFamily: appearance.fontFamily,
                    }}
                  >
                    {shortenAddress(asset.assetIssuer, 5)}
                  </a>
                ) : (
                  shortenAddress(asset.assetIssuer, 5)
                )}

                <button
                  id="bluxcc-button"
                  onClick={handleCopyIssuer}
                  className="bluxcc:flex bluxcc:items-center bluxcc:bg-transparent"
                >
                  <CDNImage
                    name={CDNFiles.Copy}
                    props={{ fill: appearance.accentColor }}
                  />
                </button>
              </span>
            ),
          },
        ]),
    {
      label: t('balance'),
      value: <span>{`${humanizeAmount(asset.assetBalance)} ${asset.assetCode}`}</span>,
    },
  ];

  return (
    <div>
      <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:gap-3 bluxcc:my-4">
        <div
          className="bluxcc:size-14 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full bluxcc:border"
          style={{
            borderColor: appearance.borderColor,
            borderWidth: appearance.borderWidth,
          }}
        >
          {isNative ? (
            <CDNImage
              name={CDNFiles.Stellar}
              props={{ fill: getContrastColor(appearance.background) }}
            />
          ) : (
            <CDNImage
              name={CDNFiles.QuestionMark}
              props={{ fill: getContrastColor(appearance.background) }}
            />
          )}
        </div>
        <div className="bluxcc:flex bluxcc:flex-col">
          <span
            className="bluxcc:text-2xl bluxcc:font-medium"
            style={{ color: appearance.accentColor }}
          >
            {humanizeAmount(asset.assetBalance)} {asset.assetCode}
          </span>
          <span
            className="bluxcc:text-sm bluxcc:font-medium"
            style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          >
            {isNative
              ? 'Stellar Lumens'
              : asset.assetIssuer
                ? shortenAddress(asset.assetIssuer, 4)
                : asset.assetCode}
          </span>
        </div>
      </div>

      <div className="bluxcc:space-y-1">
        {details.map((item, i) => {
          return (
            <div
              key={item.label}
              className="bluxcc:flex bluxcc:font-medium bluxcc:items-center bluxcc:justify-between bluxcc:text-xs bluxcc:h-8 bluxcc:px-4"
              style={{
                color: appearance.textColor,
                borderBottom:
                  i < details.length - 1
                    ? `${appearance.borderWidth} dashed ${appearance.borderColor}`
                    : 'none',
              }}
            >
              <span>{item.label}</span>
              <span
                className="bluxcc:flex bluxcc:items-center bluxcc:gap-1 bluxcc:text-xs"
                style={{ color: hexToRgba(appearance.textColor, 0.7) }}
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BalanceDetails;
