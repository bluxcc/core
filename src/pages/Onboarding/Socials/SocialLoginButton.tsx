import CardItem from '../../../components/CardItem';
import SocialProviderIcon from '../../../components/SocialProviderIcon';
import { useLang } from '../../../hooks/useLang';
import { useAppStore } from '../../../store';
import { getContrastColor } from '../../../utils/helpers';
import { getSocialDisplayName } from '../../../utils/socialLogin';

type SocialLoginButtonProps = {
  provider: string;
  onClick: (provider: string) => void;
  nameOnly?: boolean;
};

const SocialLoginButton = ({
  provider,
  onClick,
  nameOnly = false,
}: SocialLoginButtonProps) => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);
  const displayName = getSocialDisplayName(provider);

  return (
    <CardItem
      label={
        nameOnly ? displayName : t('continueWith', { provider: displayName })
      }
      startIcon={
        <SocialProviderIcon
          provider={provider}
          fill={getContrastColor(appearance.background)}
        />
      }
      onClick={() => onClick(provider)}
    />
  );
};

export default SocialLoginButton;
