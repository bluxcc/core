import CardItem from '../../../components/CardItem';
import SocialProviderIcon from '../../../components/SocialProviderIcon';
import { useLang } from '../../../hooks/useLang';
import { useAppStore } from '../../../store';
import { getContrastColor } from '../../../utils/helpers';
import { getSocialDisplayName } from '../../../utils/socialLogin';

type SocialLoginButtonProps = {
  provider: string;
  onClick: (provider: string) => void;
};

const SocialLoginButton = ({ provider, onClick }: SocialLoginButtonProps) => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);

  return (
    <CardItem
      label={t('continueWith', {
        provider: getSocialDisplayName(provider),
      })}
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
