import { useAppStore } from '../../store';
import Button from '../../components/Button';
import { useLang } from '../../hooks/useLang';
import { SupportedWallet } from '../../enums';
import Divider from '../../components/Divider';
import Summary from '../../components/Transaction/Summary';
import getTransactionDetails from '../../stellar/getTransactionDetails';
import sendTransactionProcess from '../../stellar/processes/sendTransactionProcess';
import {
  hexToRgba,
  humanizeAmount,
  shortenAddress,
  getActiveNetworkTitle,
} from '../../utils/helpers';

const SendTransaction = () => {
  const t = useLang();

  const store = useAppStore((store) => store);

  const appearance = store.config.appearance;
  const { user, stellar, sendTransaction } = store;

  if (!sendTransaction || !user || !stellar) {
    return (
      <div>
        <p>{t('invalidXdr')}</p>
      </div>
    );
  }

  const { xdr, options } = sendTransaction;

  const txDetails = getTransactionDetails(xdr, options.network);

  const handleSignTx = async () => {
    sendTransactionProcess(store);
  };

  if (!txDetails) {
    return (
      <div>
        <p>{t('invalidXdr')}</p>
      </div>
    );
  }

  const balance =
    store.balances.balances.length === 0
      ? '0'
      : store.balances.balances.find((b) => b.asset_type === 'native')!.balance;
  const isLobstr = user.authValue === SupportedWallet.Lobstr;
  const networkTitle = getActiveNetworkTitle(stellar.activeNetwork);

  return (
    <div className="bluxcc:w-full">
      <p className="bluxcc:mx-3 bluxcc:my-4 bluxcc:text-center bluxcc:text-sm bluxcc:font-medium bluxcc:select-none">
        <span className="bluxcc:font-semibold bluxcc:capitalize">
          {store.config.appName}{' '}
        </span>
        {t('signTransactionPrompt')}
      </p>

      <Summary
        operationsCount={txDetails.operations}
        sender={txDetails.sender}
        receiver={txDetails.receiver}
        network={options.network}
        estimatedFee={txDetails.estimatedFee.toString()}
        action={txDetails.action}
      />

      {isLobstr && (
        <p className="bluxcc:!my-2 bluxcc:flex bluxcc:items-center bluxcc:justify-center bluxcc:text-center bluxcc:!text-xs bluxcc:text-alert-error">
          {t('lobstrWarning', { network: networkTitle })}
        </p>
      )}

      <div
        className="bluxcc:inline-flex bluxcc:h-14 bluxcc:w-full bluxcc:items-center bluxcc:justify-between bluxcc:border bluxcc:px-4"
        style={{
          marginTop: isLobstr ? '0px' : '16px',
          borderRadius: appearance.borderRadius,
          borderColor: appearance.borderColor,
        }}
      >
        <div className="bluxcc:inline-flex bluxcc:items-center bluxcc:gap-1 bluxcc:font-medium bluxcc:whitespace-nowrap">
          <p className="bluxcc:text-sm bluxcc:font-medium bluxcc:whitespace-nowrap">
            {t('yourWallet')}
          </p>
          <p
            className="bluxcc:mt-0.5 bluxcc:text-xs"
            style={{ color: `${hexToRgba(appearance.textColor, 0.8)}` }}
          >
            {user.address
              ? shortenAddress(store.user?.address as string, 5)
              : t('noAddressFound')}
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
          <p className="bluxcc:max-w-[90px] bluxcc:text-xs bluxcc:font-normal">
            {balance ? humanizeAmount(balance) : '0'} XLM
          </p>
        </div>
      </div>

      <Divider />

      <Button
        size="large"
        state="enabled"
        variant="fill"
        onClick={handleSignTx}
      >
        {t('approve')}
      </Button>
    </div>
  );
};

export default SendTransaction;
