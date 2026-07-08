import { useState } from 'react';

import { Route } from '../../enums';
import AssetLogo from '../AssetLogo';
import CDNImage from '../CDNImage';
import { useAppStore } from '../../store';
import { ICustomToken } from '../../types';
import { useLang } from '../../hooks/useLang';
import CDNFiles from '../../constants/cdnFiles';
import {
  tokenLogoAsset,
  tokenDisplayName,
} from '../../utils/customTokens';
import {
  hexToRgba,
  humanizeAmount,
  shortenAddress,
  getContrastColor,
} from '../../utils/helpers';

type TokensListProps = {
  tokens: ICustomToken[];
};

// The Tokens tab of the Balances page: the user's custom SAC/SEP-41 tokens, with
// a pinned "Add new token" action. Mirrors AssetsList but navigates to the token
// details route. A SAC's on-chain name() is the long "CODE:ISSUER", so rows show
// the short display name + symbol chip and a shortened contract subtitle.
const TokensList = ({ tokens }: TokensListProps) => {
  const t = useLang();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const appearance = useAppStore((store) => store.config.appearance);
  const setRoute = useAppStore((store) => store.setRoute);
  const setDetailsToken = useAppStore((store) => store.setDetailsToken);
  const setDynamicTitle = useAppStore((store) => store.setDynamicTitle);

  const handleClickToken = (token: ICustomToken) => {
    setDetailsToken(token);
    // Title is the symbol (short), not name() which is the long "CODE:ISSUER".
    setDynamicTitle(token.symbol);
    setRoute(Route.TOKEN_DETAILS);
  };

  const handleAddToken = () => {
    setRoute(Route.ADD_TOKEN);
  };

  return (
    <div className="bluxcc:flex bluxcc:h-full bluxcc:w-full bluxcc:flex-col">
      <div className="bluxcc:flex-1 bluxcc:overflow-auto bluxcc:overflowStyle">
        {tokens.map((token, index) => {
          const displayName = tokenDisplayName(token.name, token.symbol);
          const logo = tokenLogoAsset(token.name, token.symbol);

          return (
            <button
              id="bluxcc-button"
              key={token.id || token.contractAddress}
              onClick={() => handleClickToken(token)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:justify-between bluxcc:py-2 bluxcc:px-4"
              style={{
                background:
                  hoveredIndex === index
                    ? appearance.fieldBackground
                    : 'transparent',
                color: appearance.textColor,
                borderBottomStyle: 'dashed',
                borderBottomWidth:
                  index < tokens.length - 1 ? appearance.borderWidth : '0px',
                borderBottomColor: appearance.borderColor,
                transition: 'all 0.2s ease-in-out',
                fontFamily: appearance.fontFamily,
              }}
            >
              <div className="bluxcc:flex bluxcc:items-center bluxcc:gap-2.5">
                <span
                  className="bluxcc:font-medium bluxcc:size-10 bluxcc:flex bluxcc:items-center bluxcc:justify-center"
                  style={{
                    borderRadius: appearance.borderRadius,
                    background: appearance.fieldBackground,
                    border: `${appearance.borderWidth} solid ${appearance.borderColor}`,
                  }}
                >
                  <AssetLogo
                    assetType="credit"
                    assetCode={logo.code}
                    assetIssuer={logo.issuer}
                    fallbackIcon={CDNFiles.QuestionMark}
                    fill={getContrastColor(appearance.fieldBackground)}
                  />
                </span>
                <div className="bluxcc:flex bluxcc:flex-col bluxcc:justify-start bluxcc:items-start">
                  <span className="bluxcc:flex bluxcc:items-center bluxcc:gap-1.5 bluxcc:text-sm bluxcc:font-medium">
                    {displayName}
                    {token.symbol && token.symbol !== displayName && (
                      <span
                        className="bluxcc:rounded bluxcc:px-1 bluxcc:py-[1px] bluxcc:text-[10px] bluxcc:font-semibold"
                        style={{
                          background: hexToRgba(appearance.textColor, 0.08),
                          color: hexToRgba(appearance.textColor, 0.7),
                        }}
                      >
                        {token.symbol}
                      </span>
                    )}
                  </span>
                  <span
                    className="bluxcc:font-semibold bluxcc:text-xs"
                    style={{ color: hexToRgba(appearance.textColor, 0.7) }}
                  >
                    {shortenAddress(token.contractAddress, 4)}
                  </span>
                </div>
              </div>

              <div className="bluxcc:flex bluxcc:flex-col bluxcc:text-right">
                <span className="bluxcc:font-medium">
                  {humanizeAmount(token.balance)}
                </span>
              </div>
            </button>
          );
        })}

        {tokens.length === 0 && (
          <div
            style={{ color: hexToRgba(appearance.textColor, 0.7) }}
            className="bluxcc:flex bluxcc:h-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:gap-2 bluxcc:text-center"
          >
            <CDNImage name={CDNFiles.GrayCube} props={{}} />
            {t('no_tokens_found')}
          </div>
        )}
      </div>

      <div className="bluxcc:flex bluxcc:shrink-0 bluxcc:justify-center bluxcc:pt-3">
        <button
          id="bluxcc-button"
          onClick={handleAddToken}
          className="bluxcc:flex bluxcc:items-center bluxcc:gap-2 bluxcc:h-11 bluxcc:px-6 bluxcc:text-sm bluxcc:font-medium bluxcc:transition-all bluxcc:duration-300"
          style={{
            color: appearance.accentColor,
            background: hexToRgba(appearance.accentColor, 0.1),
            borderRadius: appearance.borderRadius,
            fontFamily: appearance.fontFamily,
          }}
        >
          <CDNImage
            name={CDNFiles.Plus}
            props={{ fill: appearance.accentColor }}
          />
          {t('add_new_token')}
        </button>
      </div>
    </div>
  );
};

export default TokensList;
