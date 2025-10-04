import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import { WrongNetworkIcon } from '../../assets/Icons';
import { getNetworkNamesFromPassphrase } from '../../utils/helpers';

const WrongNetwork = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const supportedNetworks = getNetworkNamesFromPassphrase(
    store.config.networks,
  );

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div className="bluxcc:mb-6 bluxcc:flex bluxcc:size-[68px] bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden">
        <WrongNetworkIcon />
      </div>

      <div className="bluxcc:w-full bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-2xl">{t('wrongNetwork')}</p>
        <p className="bluxcc:text-center bluxcc:text-sm bluxcc:leading-5 bluxcc:tracking-[-2%]">
          {t('wrongNetworkMessage')} Switch to {supportedNetworks.join(' or ')}.
        </p>
      </div>
    </div>
  );
};

export default WrongNetwork;
