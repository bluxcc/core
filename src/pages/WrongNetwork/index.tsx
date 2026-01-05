import { useAppStore } from '../../store';
import { useLang } from '../../hooks/useLang';
import { WrongNetworkIcon } from '../../assets/Icons';
import {
  capitalizeFirstLetter,
  getNetworkByPassphrase,
  getNetworkNamesFromPassphrase,
} from '../../utils/helpers';

const WrongNetwork = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const supportedNetworks = getNetworkNamesFromPassphrase(
    store.config.networks,
  );

  return (
    <div
      style={{ fontFamily: store.config.appearance.fontFamily }}
      className="bluxcc:mt-4 bluxcc:mb-10 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none"
    >
      <div className="bluxcc:mb-6 bluxcc:flex bluxcc:size-17 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden">
        <WrongNetworkIcon />
      </div>

      <div className="bluxcc:w-full bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-2xl">{t('wrongNetwork')}</p>
        <p className="bluxcc:text-center bluxcc:text-sm bluxcc:leading-5 bluxcc:tracking-[-2%] bluxcc:mx-3">
          {t('wrongNetworkMessage', {
            currentNetwork: capitalizeFirstLetter(
              getNetworkByPassphrase(store.user?.walletPassphrase as string),
            ),
            switchNetwork: supportedNetworks.join(' or '),
          })}
        </p>
      </div>
    </div>
  );
};

export default WrongNetwork;
