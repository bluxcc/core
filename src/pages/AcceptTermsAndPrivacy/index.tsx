import Button from '../../components/Button';
import Divider from '../../components/Divider';
import { useLang } from '../../hooks/useLang';
import { useAppStore } from '../../store';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';
import { hexToRgba } from '../../utils/helpers';
import { completeLoginProcess } from '../../stellar/processes/continueLoginProcess';

const AcceptTermsAndPrivacy = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const { appearance } = store.config;

  const conditions: Array<{
    id: 'terms' | 'privacy';
    logo: CDNFiles;
    title: string;
    subtitle: string;
    url: string;
  }> = [];

  const terms = store.apiResponse?.terms;
  const privacyPolicy = store.apiResponse?.privacyPolicy;

  if (terms) {
    conditions.push({
      id: 'terms',
      logo: CDNFiles.Shield,
      title: t('termsOfService'),
      subtitle: t('openLink'),
      url: terms,
    });
  }

  if (privacyPolicy) {
    conditions.push({
      id: 'privacy',
      logo: CDNFiles.Globe,
      title: t('privacyPolicy'),
      subtitle: t('openLink'),
      url: privacyPolicy,
    });
  }

  const handleOpenCondition = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAgree = () => {
    completeLoginProcess();
  };

  return (
    <div className="bluxcc:mt-1 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div
        className="bluxcc:mb-6 bluxcc:flex bluxcc:size-17 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full"
        style={{
          background: hexToRgba(appearance.accentColor, 0.12),
        }}
      >
        <CDNImage
          name={CDNFiles.Shield}
          props={{ fill: appearance.accentColor }}
        />
      </div>

      <div className="bluxcc:mb-4 bluxcc:w-full bluxcc:space-y-1 bluxcc:text-center">
        <p className="bluxcc:text-xl bluxcc:font-medium">
          {t('acceptTermsAndPrivacy')}
        </p>
        <p
          className="bluxcc:text-sm bluxcc:leading-5"
          style={{ color: hexToRgba(appearance.textColor, 0.76) }}
        >
          {t('reviewAndAcceptPrompt')}
        </p>
      </div>

      <div className="bluxcc:w-full bluxcc:space-y-2">
        {conditions.map((c) => (
          <button
            type="button"
            id="bluxcc-button"
            key={c.id}
            onClick={() => handleOpenCondition(c.url)}
            className="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:gap-3 bluxcc:px-3 bluxcc:py-3 bluxcc:text-left bluxcc:transition-colors bluxcc:duration-300"
            style={{
              borderRadius: appearance.borderRadius,
              borderColor: appearance.borderColor,
              borderWidth: appearance.borderWidth,
              backgroundColor: appearance.fieldBackground,
              fontFamily: appearance.fontFamily,
            }}
          >
            <span
              className="bluxcc:flex bluxcc:size-10 bluxcc:shrink-0 bluxcc:items-center bluxcc:justify-center bluxcc:rounded-xl"
              style={{ background: hexToRgba(appearance.accentColor, 0.1) }}
            >
              <CDNImage name={c.logo} props={{ fill: appearance.accentColor }} />
            </span>

            <span className="bluxcc:flex bluxcc:flex-1 bluxcc:flex-col bluxcc:items-start">
              <span className="bluxcc:text-base bluxcc:font-medium">
                {c.title}
              </span>
              <span
                className="bluxcc:text-sm"
                style={{ color: hexToRgba(appearance.textColor, 0.7) }}
              >
                {c.subtitle}
              </span>
            </span>

            <CDNImage
              name={CDNFiles.ArrowRight}
              props={{ fill: hexToRgba(appearance.textColor, 0.65) }}
            />
          </button>
        ))}
      </div>

      {conditions.length === 0 && (
        <p
          className="bluxcc:mt-2 bluxcc:text-center bluxcc:text-sm"
          style={{ color: hexToRgba(appearance.textColor, 0.75) }}
        >
          {t('noLegalLinksProvided')}
        </p>
      )}

      <Divider />

      <Button size="large" variant="fill" state="enabled" onClick={handleAgree}>
        {t('iAgree')}
      </Button>
    </div>
  );
};

export default AcceptTermsAndPrivacy;
