import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';
import AnimatedGradient from '../../utils/animatedGradient';

const About = () => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);
  const icons = [CDNFiles.Shield, CDNFiles.Key, CDNFiles.Wallet, CDNFiles.Chip];

  return (
    <div
      className="bluxcc:flex bluxcc:flex-col bluxcc:select-none bluxcc:items-center bluxcc:justify-center bluxcc:text-center bluxcc:font-medium bluxcc:mt-4 bluxcc:mb-2"
      style={{ color: appearance.textColor }}
    >
      <AnimatedGradient
        theme="purple"
        animationSpeed={3}
        style={{ borderRadius: appearance.borderRadius }}
        className="bluxcc:size-66 bluxcc:mx-6 bluxcc:overflow-hidden bluxcc:flex bluxcc:items-center"
      >
        <div className="bluxcc:marquee_outer">
          <div className="bluxcc:marquee_track bluxcc:gap-2.5">
            {[...icons, ...icons, ...icons, ...icons].map((icon, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius:
                    appearance.borderRadius !== '0px' ? '16px' : '0px',
                }}
                className="bluxcc:size-20.5 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:bg-primary-500"
              >
                <CDNImage name={icon} props={{ fill: '#fff' }} />
              </div>
            ))}
          </div>
        </div>
      </AnimatedGradient>

      <p className="bluxcc:text-2xl bluxcc:mt-6.5 bluxcc:mb-2 bluxcc:px-6  ">
        {t('wallet_infra')}
      </p>
      <p className="bluxcc:text-sm bluxcc:text-center">{t('blux_gateway')}</p>
    </div>
  );
};

export default About;
