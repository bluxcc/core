import React, { useState } from 'react';
import { StrKey } from '@stellar/stellar-sdk';

import { Route } from '../../../../enums';
import { useAppStore } from '../../../../store';
import { apiAddToken } from '../../../../utils/api';
import Button from '../../../../components/Button';
import { useLang } from '../../../../hooks/useLang';
import Divider from '../../../../components/Divider';
import InputField from '../../../../components/Input';
import CDNImage from '../../../../components/CDNImage';
import CDNFiles from '../../../../constants/cdnFiles';
import AssetLogo from '../../../../components/AssetLogo';
import {
  hexToRgba,
  humanizeAmount,
  shortenAddress,
  getContrastColor,
} from '../../../../utils/helpers';
import {
  apiNetworkSlug,
  tokenLogoAsset,
  readTokenOnChain,
  tokenDisplayName,
  sacToClassicAsset,
  apiTokenToCustomToken,
  TokenOnChain,
} from '../../../../utils/customTokens';

type CheckStatus = 'idle' | 'checking' | 'valid' | 'invalid';

// Pills/labels use the theme's semantic alert colors (CSS vars emitted from the
// Tailwind @theme block) so they follow the configured appearance.
const successStyle = {
  color: 'var(--color-alert-success)',
  background: 'color-mix(in srgb, var(--color-alert-success) 12%, transparent)',
};
const warningStyle = {
  color: 'var(--color-alert-warning)',
  background: 'color-mix(in srgb, var(--color-alert-warning) 12%, transparent)',
};

const AddToken = () => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);
  const JWT = useAppStore((store) => store.auth?.JWT);
  const userAddress = useAppStore((store) => store.user?.address);
  const activeNetwork = useAppStore((store) => store.stellar?.activeNetwork);
  const balances = useAppStore((store) => store.balances.balances);
  const setRoute = useAppStore((store) => store.setRoute);
  const setBalancesTab = useAppStore((store) => store.setBalancesTab);
  const addCustomToken = useAppStore((store) => store.addCustomToken);

  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [checkError, setCheckError] = useState('');
  const [preview, setPreview] = useState<TokenOnChain | null>(null);
  const [alreadyInAssets, setAlreadyInAssets] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const resetCheck = () => {
    setStatus('idle');
    setPreview(null);
    setCheckError('');
    setAddError('');
    setAlreadyInAssets(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    // Any edit invalidates a previous check.
    resetCheck();
  };

  // The SAC's name() is "native"/"CODE:ISSUER" for a classic asset; if that asset
  // is already in the user's balances, it's already an Asset and can't be re-added.
  const isAlreadyInAssets = (name: string): boolean => {
    const classic = sacToClassicAsset(name);

    if (!classic) return false;

    return balances.some((b) =>
      classic.type === 'native'
        ? b.asset_type === 'native'
        : b.asset_type !== 'native' &&
          'asset_code' in b &&
          b.asset_code === classic.code &&
          'asset_issuer' in b &&
          b.asset_issuer === classic.issuer,
    );
  };

  const handleCheck = async () => {
    const value = address.trim();

    if (!StrKey.isValidContract(value)) {
      setStatus('invalid');
      setPreview(null);
      setAlreadyInAssets(false);
      setCheckError(t('invalid_address'));
      return;
    }

    setStatus('checking');
    setCheckError('');
    setAddError('');

    try {
      const result = await readTokenOnChain(value, userAddress, activeNetwork);

      setPreview(result);
      setAlreadyInAssets(isAlreadyInAssets(result.name));
      setStatus('valid');
    } catch {
      setPreview(null);
      setAlreadyInAssets(false);
      setStatus('invalid');
      setCheckError(t('could_not_validate_token'));
    }
  };

  const handleAddToken = async () => {
    if (status !== 'valid' || !preview || adding || alreadyInAssets) return;

    if (!JWT) {
      setAddError(t('errorTryAgain'));
      return;
    }

    setAdding(true);
    setAddError('');

    const slug = apiNetworkSlug(activeNetwork);

    try {
      const view = await apiAddToken(JWT, address.trim(), slug);

      addCustomToken(apiTokenToCustomToken(view, preview.balance));
      // Land back on the Tokens tab so the freshly added token is visible.
      setBalancesTab('tokens');
      setRoute(Route.BALANCES);
    } catch (e: any) {
      setAdding(false);

      const message = String(e?.message || '');

      setAddError(
        message.includes('already added')
          ? t('token_already_added')
          : t('errorTryAgain'),
      );
    }
  };

  const handleCancel = () => {
    setRoute(Route.BALANCES);
  };

  const canAdd =
    status === 'valid' && !!preview && !adding && !alreadyInAssets;

  const previewName = preview
    ? tokenDisplayName(preview.name, preview.symbol)
    : '';
  const previewLogo = preview
    ? tokenLogoAsset(preview.name, preview.symbol)
    : { code: '', issuer: '' };

  const detailRow = (label: string, value: React.ReactNode, divider = true) => (
    <div
      className="bluxcc:flex bluxcc:h-10 bluxcc:items-center bluxcc:justify-between bluxcc:px-4 bluxcc:text-xs bluxcc:font-medium"
      style={{
        color: appearance.textColor,
        borderTop: divider
          ? `${appearance.borderWidth} dashed ${appearance.borderColor}`
          : 'none',
      }}
    >
      <span>{label}</span>
      <span style={{ color: hexToRgba(appearance.textColor, 0.7) }}>{value}</span>
    </div>
  );

  return (
    <div
      className="bluxcc:flex bluxcc:flex-col"
      style={{ fontFamily: appearance.fontFamily }}
    >
      <InputField
        autoFocus
        type="text"
        value={address}
        onChange={handleChange}
        onButtonClick={handleCheck}
        label={t('enter_token_address')}
        placeholder={t('enter_address')}
        error={status === 'invalid' ? checkError : undefined}
        button={
          <span style={{ color: appearance.accentColor }}>{t('check')}</span>
        }
      />

      <div className="bluxcc:min-h-[248px] bluxcc:py-2">
        {status === 'checking' && (
          <div className="bluxcc:flex bluxcc:h-[240px] bluxcc:items-center bluxcc:justify-center">
            <CDNImage
              name={CDNFiles.Loading}
              className="bluxcc:animate-spin"
              props={{ fill: appearance.accentColor }}
            />
          </div>
        )}

        {status === 'valid' && preview && (
          <div
            style={{
              borderRadius: appearance.borderRadius,
              border: `${appearance.borderWidth} solid ${appearance.borderColor}`,
            }}
          >
            <div className="bluxcc:flex bluxcc:flex-col bluxcc:items-center bluxcc:gap-1 bluxcc:py-4">
              <div
                className="bluxcc:size-14 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full bluxcc:border"
                style={{
                  borderColor: appearance.borderColor,
                  borderWidth: appearance.borderWidth,
                }}
              >
                <AssetLogo
                  assetType="credit"
                  assetCode={previewLogo.code}
                  assetIssuer={previewLogo.issuer}
                  fallbackIcon={CDNFiles.QuestionMark}
                  fill={getContrastColor(appearance.background)}
                />
              </div>
              <div className="bluxcc:flex bluxcc:items-center bluxcc:gap-1.5">
                <span
                  className="bluxcc:text-lg bluxcc:font-semibold"
                  style={{ color: appearance.accentColor }}
                >
                  {previewName}
                </span>
                {preview.symbol && preview.symbol !== previewName && (
                  <span
                    className="bluxcc:text-sm"
                    style={{ color: hexToRgba(appearance.textColor, 0.7) }}
                  >
                    ({preview.symbol})
                  </span>
                )}
              </div>
            </div>

            {detailRow(
              t('status'),
              <span
                className="bluxcc:rounded-full bluxcc:px-2 bluxcc:py-[2px] bluxcc:text-[11px] bluxcc:font-semibold"
                style={alreadyInAssets ? warningStyle : successStyle}
              >
                {alreadyInAssets ? t('already_in_assets') : t('valid_token')}
              </span>,
              false,
            )}

            {detailRow(
              t('your_balance'),
              `${humanizeAmount(preview.balance)} ${preview.symbol}`,
            )}

            {preview.adminOrOwner
              ? detailRow(t('admin'), shortenAddress(preview.adminOrOwner, 4))
              : detailRow(t('decimals'), String(preview.decimals))}
          </div>
        )}

        {addError && (
          <p className="bluxcc:mt-2 bluxcc:px-1 bluxcc:text-center bluxcc:text-xs bluxcc:text-alert-error">
            {addError}
          </p>
        )}
      </div>

      <Divider />

      <div className="bluxcc:flex bluxcc:gap-3">
        <div className="bluxcc:flex-1">
          <Button variant="outline" size="large" onClick={handleCancel}>
            {t('cancel')}
          </Button>
        </div>
        <div className="bluxcc:flex-[1.6]">
          <Button
            size="large"
            variant="fill"
            state={canAdd ? 'enabled' : 'disabled'}
            disabled={!canAdd}
            onClick={handleAddToken}
            style={{ opacity: canAdd ? 1 : 0.5 }}
          >
            {adding ? (
              <CDNImage
                name={CDNFiles.Loading}
                className="bluxcc:animate-spin"
                props={{ fill: getContrastColor(appearance.accentColor) }}
              />
            ) : (
              t('add_token')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddToken;
