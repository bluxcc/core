type RgbChannels = {
  r: number;
  g: number;
  b: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

const safeAlpha = (alpha: number) =>
  clamp(Number.isFinite(alpha) ? alpha : 1, 0, 1);

const parseHexColor = (value: string): RgbChannels | undefined => {
  const match = value.match(/^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i);

  if (!match) return undefined;

  const hex = match[1];
  const expanded =
    hex.length <= 4
      ? hex
          .split('')
          .map((character) => character.repeat(2))
          .join('')
      : hex;

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
};

const parseRgbChannel = (value: string) => {
  const normalized = value.trim();
  const percentage = normalized.endsWith('%');
  const numeric = Number.parseFloat(normalized);

  if (!Number.isFinite(numeric)) return undefined;

  return Math.round(
    clamp(percentage ? (numeric / 100) * 255 : numeric, 0, 255),
  );
};

const parseRgbColor = (value: string): RgbChannels | undefined => {
  const match = value.match(/^rgba?\(\s*(.*?)\s*\)$/i);

  if (!match) return undefined;

  const body = match[1];
  const channels = body.includes(',')
    ? body.split(',').slice(0, 3)
    : body.split('/')[0].trim().split(/\s+/);

  if (channels.length !== 3) return undefined;

  const parsed = channels.map(parseRgbChannel);

  if (parsed.some((channel) => channel === undefined)) return undefined;

  const [r, g, b] = parsed as [number, number, number];

  return { r, g, b };
};

const parseHue = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const numeric = Number.parseFloat(normalized);

  if (!Number.isFinite(numeric)) return undefined;

  if (normalized.endsWith('turn')) return numeric * 360;
  if (normalized.endsWith('grad')) return numeric * 0.9;
  if (normalized.endsWith('rad')) return (numeric * 180) / Math.PI;

  return numeric;
};

const parsePercentage = (value: string) => {
  const normalized = value.trim();

  if (!normalized.endsWith('%')) return undefined;

  const numeric = Number.parseFloat(normalized);

  return Number.isFinite(numeric) ? clamp(numeric / 100, 0, 1) : undefined;
};

const parseHslColor = (value: string): RgbChannels | undefined => {
  const match = value.match(/^hsla?\(\s*(.*?)\s*\)$/i);

  if (!match) return undefined;

  const body = match[1];
  const channels = body.includes(',')
    ? body.split(',').slice(0, 3)
    : body.split('/')[0].trim().split(/\s+/);

  if (channels.length !== 3) return undefined;

  const hue = parseHue(channels[0]);
  const saturation = parsePercentage(channels[1]);
  const lightness = parsePercentage(channels[2]);

  if (
    hue === undefined ||
    saturation === undefined ||
    lightness === undefined
  ) {
    return undefined;
  }

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = (((hue % 360) + 360) % 360) / 60;
  const intermediate = chroma * (1 - Math.abs((segment % 2) - 1));
  const offset = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green] = [chroma, intermediate];
  else if (segment < 2) [red, green] = [intermediate, chroma];
  else if (segment < 3) [green, blue] = [chroma, intermediate];
  else if (segment < 4) [green, blue] = [intermediate, chroma];
  else if (segment < 5) [red, blue] = [intermediate, chroma];
  else [red, blue] = [chroma, intermediate];

  return {
    r: Math.round((red + offset) * 255),
    g: Math.round((green + offset) * 255),
    b: Math.round((blue + offset) * 255),
  };
};

const parseColor = (color: string): RgbChannels | undefined => {
  if (typeof color !== 'string') return undefined;

  const normalized = color.trim();

  return (
    parseHexColor(normalized) ??
    parseRgbColor(normalized) ??
    parseHslColor(normalized)
  );
};

const getLuminance = (color: string) => {
  const channels = parseColor(color);

  if (!channels) return undefined;

  return (0.299 * channels.r + 0.587 * channels.g + 0.114 * channels.b) / 255;
};

/** Applies an alpha value to a CSS color without throwing during render. */
export const hexToRgba = (color: string, alpha: number = 1) => {
  const opacity = safeAlpha(alpha);
  const channels = parseColor(color);

  if (channels) {
    return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${opacity})`;
  }

  const normalized = typeof color === 'string' ? color.trim() : '';

  if (!normalized) return `rgba(0, 0, 0, ${opacity})`;

  // Browsers that serialize newer color spaces (for example oklch()) also
  // support color-mix(). An invalid consumer value is ignored by CSS instead
  // of becoming an exception that unmounts the React tree.
  return `color-mix(in srgb, ${normalized} ${opacity * 100}%, transparent)`;
};

export const getContrastColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);

  return luminance !== undefined && luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export const isBackgroundDark = (backgroundColor: string): boolean => {
  const luminance = getLuminance(backgroundColor);

  return luminance === undefined || luminance <= 0.5;
};
