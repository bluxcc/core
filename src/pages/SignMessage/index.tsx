import { Route } from '../../enums';
import { useAppStore } from '../../store';
import Button from '../../components/Button';
import { useLang } from '../../hooks/useLang';
import Divider from '../../components/Divider';
import { hexToRgba, shortenAddress } from '../../utils/helpers';
import signMessageProcess from '../../stellar/processes/signMessageProcess';
import signAuthEntryProcess from '../../stellar/processes/signAuthEntryProcess';

const SignMessage = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const appearance = store.config.appearance;

  if (
    store.waitingStatus !== 'signMessage' &&
    store.waitingStatus !== 'signAuthEntry'
  ) {
    store.setRoute(Route.FAILED);

    return null;
  }

  const isSignMessage = store.waitingStatus === 'signMessage';
  const data = isSignMessage ? store.signMessage : store.signAuthEntry;

  if (!data) {
    return null;
  }

  const handleSign = async () => {
    if (isSignMessage) {
      signMessageProcess(store);
    } else {
      signAuthEntryProcess(store);
    }
  };

  const displayMessage = isSignMessage
    ? (data as any).message
    : (data as any).authEntry; // adjust according to your actual data structure

  return (
    <div>
      <div className="bluxcc:p-4 bluxcc:text-center bluxcc:text-sm bluxcc:font-medium bluxcc:select-none">
        <span className="bluxcc:font-semibold bluxcc:capitalize">
          {store.config.appName}{' '}
        </span>
        {t('sign_permission')}
      </div>
      <div
        className="bluxcc:h-24 bluxcc:p-4 bluxcc:font-mono bluxcc:text-xs bluxcc:overflow-auto"
        style={{
          border: `${appearance.borderWidth} solid ${appearance.borderColor}`,
          borderRadius: appearance.borderRadius,
        }}
      >
        {displayMessage}
      </div>
      <div
        className="bluxcc:inline-flex bluxcc:mt-4 bluxcc:h-14 bluxcc:w-full bluxcc:items-center bluxcc:justify-between bluxcc:border bluxcc:px-4"
        style={{
          borderRadius: appearance.borderRadius,
          borderColor: appearance.borderColor,
        }}
      >
        <div className="bluxcc:inline-flex bluxcc:items-center bluxcc:gap-1 bluxcc:font-medium bluxcc:whitespace-nowrap">
          <p className="bluxcc:text-sm bluxcc:font-medium bluxcc:whitespace-nowrap">
            {t('yourWallet')}
          </p>
        </div>
        <div
          className="bluxcc:overflow-hidden bluxcc:px-[10px] bluxcc:py-2"
          style={{
            borderRadius: appearance.borderRadius,
            backgroundColor: appearance.fieldBackground,
            color: appearance.textColor,
          }}
        >
          <p
            className="bluxcc:mt-0.5 bluxcc:text-xs"
            style={{ color: `${hexToRgba(appearance.textColor, 0.8)}` }}
          >
            {store.user?.address
              ? shortenAddress(store.user?.address as string, 5)
              : t('noAddressFound')}
          </p>
        </div>
      </div>

      <Divider />

      <Button size="large" state="enabled" variant="fill" onClick={handleSign}>
        {t('approve')}
      </Button>
    </div>
  );
};

export default SignMessage;
