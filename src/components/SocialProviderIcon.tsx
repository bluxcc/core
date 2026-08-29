import CDNImage from './CDNImage';
import { SOCIAL_PROVIDERS } from '../utils/socialLogin';

const SocialProviderIcon = ({
  provider,
  fill,
}: {
  provider: string;
  fill?: string;
}) => {
  const icon = SOCIAL_PROVIDERS[provider]?.icon;

  if (!icon) return null;

  if (typeof icon === 'string') {
    return <CDNImage name={icon} />;
  }

  const Icon = icon;
  return <Icon fill={fill} />;
};

export default SocialProviderIcon;
