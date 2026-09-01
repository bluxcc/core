import CDNFiles from '../constants/cdnFiles';
import CDNImage from '../components/CDNImage';
import AppleLogo from '../assets/socials/AppleLogo';
import MetaLogo from '../assets/socials/MetaLogo';
import GitHubLogo from '../assets/socials/GitHubLogo';
import DiscordLogo from '../assets/socials/DiscordLogo';
import TelegramLogo from '../assets/socials/TelegramLogo';
import {
  XLogo,
  KickLogo,
  SteamLogo,
  GoogleLogo,
  GitLabLogo,
  TwitchLogo,
  SpotifyLogo,
  TikTokLogo,
  LinkedInLogo,
  FarcasterLogo,
  InstagramLogo,
  MicrosoftLogo,
} from '../assets/socials/AdditionalSocialLogos';
import { canonicalSocialName } from './socialLogin';

const handleSocialLogos = (
  provider: string,
  isDark: boolean,
  size: 'small' | 'large' = 'small',
) => {
  const px = size === 'large' ? 40 : 24;
  const mono = isDark ? '#ffffff' : '#000000';
  const name = canonicalSocialName(provider);

  switch (name) {
    case 'google':
      return <GoogleLogo size={px} />;
    case 'farcaster':
      return <FarcasterLogo size={px} />;
    case 'tiktok':
      return <TikTokLogo fill={mono} size={px} />;
    case 'linkedin':
      return <LinkedInLogo size={px} />;
    case 'twitch':
      return <TwitchLogo size={px} />;
    case 'kick':
      return <KickLogo size={px} />;
    case 'spotify':
      return <SpotifyLogo size={px} />;
    case 'instagram':
      return <InstagramLogo size={px} />;
    case 'apple':
      return <AppleLogo fill={mono} size={px} />;
    case 'discord':
      return <DiscordLogo size={px} />;
    case 'github':
      return <GitHubLogo fill={mono} size={px} />;
    case 'meta':
      return <MetaLogo size={px} />;
    case 'telegram':
      return <TelegramLogo size={px} />;
    case 'microsoft':
      return <MicrosoftLogo size={px} />;
    case 'gitlab':
      return <GitLabLogo size={px} />;
    case 'twitter':
      return <XLogo fill={mono} size={px} />;
    case 'steam':
      return <SteamLogo fill={mono} size={px} />;
    default:
      return (
        <CDNImage
          name={CDNFiles.Globe}
          props={{ fill: mono }}
        />
      );
  }
};

export default handleSocialLogos;
