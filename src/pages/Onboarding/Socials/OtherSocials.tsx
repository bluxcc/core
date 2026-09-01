import { useLang } from '../../../hooks/useLang';
import { useAppStore } from '../../../store';
import {
  beginSocialLogin,
  getEnabledSocials,
  isTelegramLogin,
} from '../../../utils/socialLogin';
import SocialLoginButton from './SocialLoginButton';

const OtherSocials = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;
  const loginMethods = store.config.loginMethods || [];
  const otherSocials = getEnabledSocials(
    loginMethods,
    store.apiResponse,
  ).slice(1);

  const handleConnectSocial = (provider: string) => {
    if (!isTelegramLogin(provider, store.apiResponse)) {
      beginSocialLogin(provider, store.config.appId);
    }

    store.connectSocial(provider);
  };

  return (
    <div className="bluxcc:w-full">
      <p
        className="bluxcc:mb-4 bluxcc:text-center bluxcc:text-sm bluxcc:font-medium"
        style={{
          color: appearance.textColor,
          fontFamily: appearance.fontFamily,
        }}
      >
        {t('otherSocialsHelp')}
      </p>

      <div className="bluxcc:max-h-81 bluxcc:space-y-2 bluxcc:overflow-y-auto bluxcc:overflowStyle">
        {otherSocials.map((provider) => (
          <SocialLoginButton
            key={provider}
            provider={provider}
            onClick={handleConnectSocial}
          />
        ))}
      </div>
    </div>
  );
};

export default OtherSocials;
