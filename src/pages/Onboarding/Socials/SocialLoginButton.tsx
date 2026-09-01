import CardItem from '../../../components/CardItem';
import { useLang } from '../../../hooks/useLang';
import { useAppStore } from '../../../store';
import { isBackgroundDark } from '../../../utils/helpers';
import handleSocialLogos from '../../../utils/socialLogos';
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
      startIcon={handleSocialLogos(
        provider,
        isBackgroundDark(appearance.background),
      )}
      onClick={() => onClick(provider)}
    />
  );
};

export default SocialLoginButton;
