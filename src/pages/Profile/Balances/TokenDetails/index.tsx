import { useEffect, useState, ReactNode } from 'react';

import { Route } from '../../../../enums';
import { useAppStore } from '../../../../store';
import { apiDeleteToken } from '../../../../utils/api';
import { useLang } from '../../../../hooks/useLang';
import CDNFiles from '../../../../constants/cdnFiles';
import CDNImage from '../../../../components/CDNImage';
import AssetLogo from '../../../../components/AssetLogo';
import {
  NETWORK_DISPLAY_NAMES,
  DEFAULT_NETWORKS_TRANSPORTS,
} from '../../../../constants/networkDetails';
import {
  copyText,
  hexToRgba,
  shortenAddress,
  humanizeAmount,
  getContrastColor,
} from '../../../../utils/helpers';
import {
  tokenLogoAsset,
  readTokenOnChain,
  tokenDisplayName,
  TokenOnChain,
} from '../../../../utils/customTokens';

type DetailRow = {
  label: string;
  value: ReactNode;
  divider: boolean;
};

const TokenDetails = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;

  const token = store.detailsToken;
  const JWT = store.auth?.JWT;
  const userAddress = store.user?.address;
  const activeNetwork = store.stellar?.activeNetwork || '';

  const [details, setDetails] = useState<TokenOnChain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // The token name is shown as the modal title; clear it when leaving.
  useEffect(() => {
    return () => {
      store.setDynamicTitle('');
    };
  }, []);

  useEffect(() => {
    if (!token) {
      store.setRoute(Route.BALANCES);
    }
  }, [token]);

  // Read fresh on-chain state (balance + admin/owner, which the store doesn't
  // hold) when the page opens. Best-effort: the stored snapshot is the fallback.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    readTokenOnChain(token.contractAddress, userAddress, activeNetwork)
      .then((result) => {
        if (!cancelled) setDetails(result);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token?.contractAddress, userAddress, activeNetwork]);

  if (!token) {
    return null;
  }

  const balance = details?.balance ?? token.balance;
  const adminOrOwner = details?.adminOrOwner;
  const decimals = details?.decimals ?? token.decimals;
  const mutedStyle = { color: hexToRgba(appearance.textColor, 0.7) };
  // A SAC's name() is the long "CODE:ISSUER"; show the short symbol-based name
  // and resolve the real curated logo (generic fallback, never the XLM glyph).
  const displayName = tokenDisplayName(token.name, token.symbol);
  const logo = tokenLogoAsset(token.name, token.symbol);

  const networkName =
    NETWORK_DISPLAY_NAMES[activeNetwork] ||
    DEFAULT_NETWORKS_TRANSPORTS[activeNetwork]?.name ||
    t('network');

  const copyWithToast = (value: string) => {
    copyText(value)
      .then(() => {
        store.setAlert('copy', t('address_copied'));

        setTimeout(() => {
          store.setAlert('none', '');
        }, 1000);
      })
      .catch(() => {});
  };

  const addressValue = (value: string) => (
    <span className="bluxcc:flex bluxcc:items-center bluxcc:gap-1">
      <span style={{ color: appearance.accentColor }}>
        {shortenAddress(value, 4)}
      </span>
      <button
        id="bluxcc-button"
        onClick={() => copyWithToast(value)}
        className="bluxcc:flex bluxcc:items-center bluxcc:bg-transparent"
      >
        <CDNImage name={CDNFiles.Copy} props={{ fill: appearance.accentColor }} />
      </button>
    </span>
  );

  const rows: DetailRow[] = [
    {
      label: t('network'),
      value: (
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
      ),
      divider: false,
    },
    {
      label: t('contract'),
      value: addressValue(token.contractAddress),
      divider: false,
    },
    {
      label: t('symbol'),
      value: <span style={mutedStyle}>{token.symbol}</span>,
      divider: true,
    },
    {
      label: t('decimals'),
      value: <span style={mutedStyle}>{decimals}</span>,
      divider: true,
    },
  ];

  if (adminOrOwner) {
    rows.push({
      label: t('admin'),
      value: addressValue(adminOrOwner),
      divider: true,
    });
  }

  const handleDelete = async () => {
    if (deleting) return;

    if (!JWT) {
      setDeleteError(t('errorTryAgain'));
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await apiDeleteToken(JWT, token.id);

      store.removeCustomToken(token.network, token.id);
      store.setDetailsToken(undefined);
      store.setBalancesTab('tokens');
      store.setRoute(Route.BALANCES);
    } catch {
      setDeleting(false);
      setDeleteError(t('errorTryAgain'));
    }
  };

  return (
    <div>
      <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-between bluxcc:gap-3 bluxcc:my-5 bluxcc:px-4">
        <div className="bluxcc:flex bluxcc:items-center bluxcc:gap-2.5">
          <div
            className="bluxcc:size-14 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full bluxcc:border"
            style={{
              borderColor: appearance.borderColor,
              borderWidth: appearance.borderWidth,
            }}
          >
            <AssetLogo
              assetType="credit"
              assetCode={logo.code}
              assetIssuer={logo.issuer}
              fallbackIcon={CDNFiles.QuestionMark}
              fill={getContrastColor(appearance.background)}
            />
          </div>
          <div className="bluxcc:flex bluxcc:flex-col">
            <span className="bluxcc:text-base bluxcc:font-semibold">
              {displayName}
            </span>
            <span className="bluxcc:text-xs bluxcc:font-medium" style={mutedStyle}>
              {token.symbol !== displayName
                ? token.symbol
                : shortenAddress(token.contractAddress, 4)}
            </span>
          </div>
        </div>

        <div className="bluxcc:flex bluxcc:flex-col bluxcc:items-end bluxcc:text-right">
          <span
            className="bluxcc:text-2xl bluxcc:font-semibold bluxcc:leading-7"
            style={{ color: appearance.accentColor }}
          >
            {humanizeAmount(balance)}
          </span>
          <span className="bluxcc:text-xs bluxcc:font-medium" style={mutedStyle}>
            {token.symbol}
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

      <div className="bluxcc:mt-6 bluxcc:px-4">
        {deleteError && (
          <p className="bluxcc:mb-2 bluxcc:text-center bluxcc:text-xs bluxcc:text-alert-error">
            {deleteError}
          </p>
        )}

        <button
          id="bluxcc-button"
          onClick={handleDelete}
          className="bluxcc:flex bluxcc:h-[52px] bluxcc:w-full bluxcc:items-center bluxcc:justify-center bluxcc:text-base bluxcc:font-medium bluxcc:transition-all bluxcc:duration-300"
          style={{
            color: 'var(--color-alert-error)',
            background:
              'color-mix(in srgb, var(--color-alert-error) 10%, transparent)',
            borderRadius: appearance.borderRadius,
            fontFamily: appearance.fontFamily,
            pointerEvents: deleting ? 'none' : undefined,
          }}
        >
          {deleting ? (
            <CDNImage
              name={CDNFiles.Loading}
              className="bluxcc:animate-spin"
              props={{ fill: 'var(--color-alert-error)' }}
            />
          ) : (
            t('delete_token')
          )}
        </button>
      </div>
    </div>
  );
};

export default TokenDetails;
