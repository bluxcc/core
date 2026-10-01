import { useAppStore } from '../../store';
import Button from '../../components/Button';
import { useLang } from '../../hooks/useLang';
import Divider from '../../components/Divider';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';
import handleLogos from '../../utils/walletLogos';
import { isBackgroundDark } from '../../utils/helpers';

const Waiting = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  const { user } = store;

  const waitingStatus = store.waitingStatus;
  const appearance = store.config.appearance;
  const walletName = user?.authValue ?? 'wallet';

  const getWaitingContent = () => {
    switch (waitingStatus) {
      case 'signMessage':
        return {
          title: t('signingMessageWith', { walletName }),
          message: t('signMessageInWallet'),
          action: t('signingMessage'),
        };
      case 'signAuthEntry':
        return {
          title: t('signingAuthEntryWith', { walletName }),
          message: t('signAuthEntryInWallet'),
          action: t('signingAuthEntry'),
        };
      case 'sendTransaction':
        return {
          title: t('signingTransactionWith', { walletName }),
          message: t('signTransactionInWallet'),
          action: t('signingTransaction'),
        };
      case 'login':
      default:
        return {
          title: t('waitingFor', { walletName }),
          message: t('acceptConnection'),
          action: t('connecting'),
        };
    }
  };

  const content = getWaitingContent();

  return (
    <div className="bluxcc:mt-3 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div
        className={`bluxcc:mb-6 bluxcc:flex bluxcc:size-20 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full`}
        style={{
          borderColor: appearance.borderColor,
          borderWidth: appearance.borderWidth,
        }}
      >
        {handleLogos(
          user?.authValue ?? '',
          isBackgroundDark(appearance.background),
          'large',
        )}
      </div>

      <div className="bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl">{content.title}</p>
        <p className="bluxcc:text-sm">{content.message}</p>
      </div>

      <Divider />

      <Button
        state="disabled"
        variant="outline"
        startIcon={
          <CDNImage
            className="bluxcc:animate-spin"
            name={CDNFiles.Loading}
            props={{ fill: appearance.accentColor }}
          />
        }
      >
        {content.action}
      </Button>
    </div>
  );
};

export default Waiting;
