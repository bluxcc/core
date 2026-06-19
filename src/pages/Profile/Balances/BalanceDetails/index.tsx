import { useEffect, ReactNode } from 'react';
import { Horizon } from '@stellar/stellar-sdk';

import { Route } from '../../../../enums';
import { useAppStore } from '../../../../store';
import { useLang } from '../../../../hooks/useLang';
import CDNFiles from '../../../../constants/cdnFiles';
import CDNImage from '../../../../components/CDNImage';
import { assetValueKey } from '../../../../utils/prices';
import {
  NETWORK_DISPLAY_NAMES,
  DEFAULT_NETWORKS_TRANSPORTS,
} from '../../../../constants/networkDetails';
import {
  copyText,
  hexToRgba,
  formatUsd,
  shortenAddress,
  humanizeAmount,
  getExplorerUrl,
  getContrastColor,
} from '../../../../utils/helpers';

// The largest trustline limit Stellar allows (max int64 in stroops); shown as
// "unlimited" rather than a meaningless 14-digit number.
const MAX_TRUSTLINE_LIMIT = '922337203685.4775807';

type DetailRow = {
  label: string;
  value: ReactNode;
  // Whether to draw the dashed separator above this row. The Network/Issuer
  // header group has none; the metric rows below each get one (matches Figma).
  divider: boolean;
};

const BalanceDetails = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;

  const asset = store.detailsAsset;
  const balances = store.balances.balances;
  const balanceValues = store.balanceValues;
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

  // The live balance line carries the fields the picked IAsset doesn't
  // (liabilities, limit, authorization); fall back to the asset snapshot.
  const line = balances.find((b) =>
    isNative
      ? b.asset_type === 'native'
      : // @ts-ignore - liquidity pool lines carry no asset_code/asset_issuer
        b.asset_code === asset.assetCode && b.asset_issuer === asset.assetIssuer,
  ) as Horizon.HorizonApi.BalanceLine | undefined;

  const balanceAmount = line?.balance ?? asset.assetBalance;
  const usdValue =
    balanceValues[
      assetValueKey(asset.assetType, asset.assetCode, asset.assetIssuer)
    ] ??
    asset.valueInCurrency ??
    '0';
  const hasUsdValue = Number(usdValue) > 0;

  const networkName =
    NETWORK_DISPLAY_NAMES[activeNetwork] ||
    DEFAULT_NETWORKS_TRANSPORTS[activeNetwork]?.name ||
    t('network');

  const sellingLiabilities =
    line && 'selling_liabilities' in line ? line.selling_liabilities : '0';
  const buyingLiabilities =
    line && 'buying_liabilities' in line ? line.buying_liabilities : '0';
  const limit = line && 'limit' in line ? line.limit : null;
  const isAuthorized =
    line && 'is_authorized' in line ? line.is_authorized : null;

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
      .catch(() => {});
  };

  const mutedStyle = { color: hexToRgba(appearance.textColor, 0.7) };

  const networkValue = (
    <span
      className="bluxcc:flex bluxcc:items-center bluxcc:gap-1"
      style={{ color: appearance.accentColor }}
    >
      {networkName}
      <CDNImage
        name={CDNFiles.StellarSmall}
        props={{ fill: appearance.accentColor }}
      />
    </span>
  );

  const issuerValue = (
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
        <span style={{ color: appearance.accentColor }}>
          {shortenAddress(asset.assetIssuer, 5)}
        </span>
      )}

      <button
        id="bluxcc-button"
        onClick={handleCopyIssuer}
        className="bluxcc:flex bluxcc:items-center bluxcc:bg-transparent"
      >
        <CDNImage name={CDNFiles.Copy} props={{ fill: appearance.accentColor }} />
      </button>
    </span>
  );

  const rows: DetailRow[] = [
    { label: t('network'), value: networkValue, divider: false },
  ];

  if (!isNative && asset.assetIssuer) {
    rows.push({ label: t('issuer'), value: issuerValue, divider: false });
  }

  rows.push(
    {
      label: t('sellingLiabilities'),
      value: (
        <span style={mutedStyle}>{humanizeAmount(sellingLiabilities)}</span>
      ),
      divider: true,
    },
    {
      label: t('buyingLiabilities'),
      value: (
        <span style={mutedStyle}>{humanizeAmount(buyingLiabilities)}</span>
      ),
      divider: true,
    },
  );

  if (!isNative) {
    rows.push({
      label: t('limit'),
      value: (
        <span style={mutedStyle}>
          {limit == null
            ? '—'
            : limit === MAX_TRUSTLINE_LIMIT
              ? '∞'
              : humanizeAmount(limit, true)}
        </span>
      ),
      divider: true,
    });

    if (isAuthorized !== null) {
      rows.push({
        label: t('authorized'),
        value: <span style={mutedStyle}>{isAuthorized ? t('yes') : t('no')}</span>,
        divider: true,
      });
    }
  }

  return (
    <div>
      <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:gap-3 bluxcc:my-5">
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
            className="bluxcc:text-3xl bluxcc:font-semibold bluxcc:leading-8"
            style={{ color: appearance.accentColor }}
          >
            {hasUsdValue
              ? formatUsd(usdValue)
              : `${humanizeAmount(balanceAmount)} ${asset.assetCode}`}
          </span>
          <span
            className="bluxcc:text-sm bluxcc:font-medium"
            style={mutedStyle}
          >
            {hasUsdValue
              ? `${humanizeAmount(balanceAmount)} ${asset.assetCode}`
              : isNative
                ? 'Stellar Lumens'
                : asset.assetIssuer
                  ? shortenAddress(asset.assetIssuer, 4)
                  : asset.assetCode}
          </span>
        </div>
      </div>

      <div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="bluxcc:flex bluxcc:font-medium bluxcc:items-center bluxcc:justify-between bluxcc:text-xs bluxcc:h-10 bluxcc:px-4"
            style={{
              color: appearance.textColor,
              fontFamily: appearance.fontFamily,
              borderTop: row.divider
                ? `${appearance.borderWidth} dashed ${appearance.borderColor}`
                : 'none',
            }}
          >
            <span>{row.label}</span>
            <span className="bluxcc:flex bluxcc:items-center bluxcc:gap-1 bluxcc:text-xs">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BalanceDetails;
