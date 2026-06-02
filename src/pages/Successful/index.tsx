import { useAppStore } from '../../store';
import Button from '../../components/Button';
import { useLang } from '../../hooks/useLang';
import Divider from '../../components/Divider';
import CDNFiles from '../../constants/cdnFiles';
import CDNImage from '../../components/CDNImage';
import {
  hexToRgba,
  getExplorerUrl,
  capitalizeFirstLetter,
} from '../../utils/helpers';

const Successful = () => {
  const t = useLang();
  const store = useAppStore((store) => store);

  let hash = '';
  if (
    typeof store.sendTransaction?.result === 'object' &&
    store.sendTransaction.result.hash
  ) {
    hash = store.sendTransaction.result.hash;
  }

  const network = store.sendTransaction?.options?.network || '';
  const explorerUrl = hash
    ? getExplorerUrl(network, store.config.explorer, 'transactionUrl', hash)
    : null;

  const handleGoToExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDone = () => {
    const currentStatus = store.waitingStatus;

    if (currentStatus === 'sendTransaction' && store.sendTransaction) {
      const { resolver, result } = store.sendTransaction;
      if (resolver && result) resolver(result);
    } else if (currentStatus === 'signMessage' && store.signMessage) {
      const { resolver, result } = store.signMessage;
      if (resolver && result) resolver(result);
    } else if (currentStatus === 'signAuthEntry' && store.signAuthEntry) {
      const { resolver, result } = store.signAuthEntry;
      if (resolver && result) resolver(result);
    } else if (currentStatus === 'login') {
    }

    setTimeout(() => {
      // @ts-ignore
      store.cleanUp(currentStatus);

      store.closeModal();
    }, 150);
  };
  //
  const getSuccessContent = () => {
    switch (store.waitingStatus) {
      case 'login':
        return {
          title: t('connectionSuccessfulTitle'),
          message: t('connectionSuccessfulMessage', {
            appName: capitalizeFirstLetter(store.config.appName),
          }),
        };
      case 'signMessage':
        return {
          title: t('messageSignedTitle') || 'Message Signed',
          message:
            t('messageSignedMessage') ||
            'Your message has been signed successfully.',
        };
      case 'signAuthEntry':
        return {
          title: t('authEntrySignedTitle') || 'Authorization Signed',
          message:
            t('authEntrySignedMessage') ||
            'Authorization has been signed successfully.',
        };
      case 'sendTransaction':
      default:
        return {
          title: t('transactionSuccessfulTitle'),
          message: t('transactionSuccessfulMessage'),
        };
    }
  };

  const { title, message } = getSuccessContent();

  return (
    <div className="bluxcc:mt-4 bluxcc:flex bluxcc:w-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:select-none">
      <div
        style={{
          background: hexToRgba(store.config.appearance.accentColor, 0.1),
        }}
        className="bluxcc:mb-6 bluxcc:flex bluxcc:size-17 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:rounded-full"
      >
        <CDNImage
          name={CDNFiles.GreenCheck}
          props={{ fill: store.config.appearance.accentColor }}
        />
      </div>

      <div className="bluxcc:w-full bluxcc:flex-col bluxcc:space-y-2 bluxcc:text-center bluxcc:font-medium">
        <p className="bluxcc:text-xl">{title}</p>
        <p className="bluxcc:text-center bluxcc:text-sm bluxcc:leading-5">
          {message}
        </p>
      </div>

      {store.waitingStatus === 'sendTransaction' &&
        hash &&
        typeof explorerUrl == 'string' && (
          <Button
            state="enabled"
            variant="outline"
            size="small"
            className="bluxcc:mt-4"
            onClick={handleGoToExplorer}
          >
            {t('seeInExplorer')}
          </Button>
        )}

      <Divider />

      {store.waitingStatus === 'login' ? (
        <Button state="disabled" variant="outline">
          {t('loggingIn')}
        </Button>
      ) : (
        <Button
          state="enabled"
          variant="fill"
          size="large"
          onClick={handleDone}
        >
          {t('done')}
        </Button>
      )}
    </div>
  );
};

export default Successful;
