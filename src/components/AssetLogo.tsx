import { useEffect, useMemo, useState } from 'react';

import CDNImage from './CDNImage';
import { useAppStore } from '../store';
import CDNFiles from '../constants/cdnFiles';
import { assetMetaKey } from '../utils/preloadAssetMeta';

// Uniform on-screen size (px) for every asset logo, matching the bundled
// Stellar/QuestionMark SVGs (40×40) so remote logos and SVG fallbacks align
// across all pages. Change here to resize asset logos everywhere at once.
const ASSET_LOGO_SIZE = 40;

type AssetLogoProps = {
  assetCode: string;
  assetIssuer: string;
  assetType: string;
  /** Fill color forwarded to the bundled SVG fallbacks (native / question mark). */
  fill?: string;
  /** SVG shown for native XLM. */
  nativeIcon?: CDNFiles;
  /** SVG shown when no logo is found or the remote image fails to load. */
  fallbackIcon?: CDNFiles;
  className?: string;
};

/**
 * Renders an asset's logo: the curated remote icon when we have one, otherwise
 * the bundled Stellar (native) or question-mark (unknown) SVG. Subscribes to the
 * asset-meta map, so logos appear automatically once the blob finishes loading.
 */
const AssetLogo = ({
  assetCode,
  assetIssuer,
  assetType,
  fill,
  nativeIcon = CDNFiles.Stellar,
  fallbackIcon = CDNFiles.QuestionMark,
  className,
}: AssetLogoProps) => {
  const assetMeta = useAppStore((state) => state.assetMeta);
  const activeNetwork = useAppStore((state) => state.stellar?.activeNetwork);
  const [errored, setErrored] = useState(false);

  const icon = useMemo(() => {
    if (assetType === 'native' || !assetMeta) return undefined;

    return assetMeta[assetMetaKey(activeNetwork, assetCode, assetIssuer)]?.icon;
  }, [assetMeta, activeNetwork, assetCode, assetIssuer, assetType]);

  // Reset the error flag when the resolved icon changes (e.g. the same component
  // instance is reused for a different asset, or the blob loads in late).
  useEffect(() => setErrored(false), [icon]);

  const fallbackProps: Record<string, string> = fill ? { fill } : {};

  if (assetType === 'native') {
    return (
      <CDNImage name={nativeIcon} props={fallbackProps} className={className} />
    );
  }

  if (icon && !errored) {
    return (
      <img
        src={icon}
        alt={assetCode}
        className={className}
        onError={() => setErrored(true)}
        style={{
          width: ASSET_LOGO_SIZE,
          height: ASSET_LOGO_SIZE,
          objectFit: 'contain',
          borderRadius: 'inherit',
        }}
      />
    );
  }

  return (
    <CDNImage name={fallbackIcon} props={fallbackProps} className={className} />
  );
};

export default AssetLogo;
