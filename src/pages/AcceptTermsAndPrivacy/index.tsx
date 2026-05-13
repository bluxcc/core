import Button from '../../components/Button';
import Divider from '../../components/Divider';
import { useLang } from '../../hooks/useLang';
import { useAppStore } from '../../store';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';
import { hexToRgba } from '../../utils/helpers';
import { completeLoginProcess } from '../../stellar/processes/continueLoginProcess';
import Link from '../../components/Link';
import { ArrowOutward, Terms } from '../../assets';

const AcceptTermsAndPrivacy = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const { appearance } = store.config;

  const terms = store.apiResponse?.terms;
  const privacyPolicy = store.apiResponse?.privacyPolicy;

  {
    /* todo: if legal link were not provided do not show this page at all */
  }
  {
    /* {conditions.length === 0 && (
        <p
          className="bluxcc:mt-2 bluxcc:text-center bluxcc:text-sm"
          style={{ color: hexToRgba(appearance.textColor, 0.75) }}
        >
          {t('noLegalLinksProvided')}
        </p>
      )} */
  }
  const Links = [
    {
      label: 'Terms of Service',
      icon: <ArrowOutward />,
      href: terms,
    },
    {
      label: 'Privacy Policy',
      icon: <ArrowOutward />,
      href: privacyPolicy,
    },
  ];

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
        {/* <CDNImage
          name={CDNFiles.Shield}
          props={{ fill: appearance.accentColor }}
        /> */}
        <Terms fill={appearance.accentColor} />
      </div>
      <div className="bluxcc:mb-10 bluxcc:w-full bluxcc:text-center">
        <p
          className="bluxcc:text-base bluxcc:font-medium"
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
        >
          {t('acceptTermsAndPrivacy')}
        </p>
      </div>

      {Links.map((item) => (
        <Link key={item.label} {...item} />
      ))}

      <Divider />
      <div className="bluxcc:flex bluxcc:flex-col bluxcc:gap-2 bluxcc:w-full">
        <Button
          size="large"
          variant="fill"
          state="enabled"
          onClick={handleAgree}
        >
          {t('agree')}
        </Button>
        <button
          style={{
            color: hexToRgba(appearance.textColor, 0.9),
            fontFamily: appearance.fontFamily,
          }}
          id="bluxcc-button"
          onClick={handleAgree}
          className="bluxcc:flex bluxcc:h-11 bluxcc:font-medium bluxcc:text-base bluxcc:w-full bluxcc:bg-transparent bluxcc:items-center bluxcc:justify-center"
        >
          {t('disagree')}
        </button>
      </div>
    </div>
  );
};

export default AcceptTermsAndPrivacy;
