import {
  capitalizeFirstLetter,
  copyText,
  shortenAddress,
} from '../../../utils/helpers';
import { DEFAULT_NETWORKS_TRANSPORTS } from '../../../constants/networkDetails';
import { useAppStore } from '../../../store';
import { useLang } from '../../../hooks/useLang';

interface TransactionDetail {
  label: string;
  value: string;
  isHighlighted?: boolean;
  isCopyable?: boolean;
  copyValue?: string;
}

interface SummaryProps {
  operationsCount: number;
  sender: string;
  receiver?: string | null;
  estimatedFee: string;
  action: string;
  network: string;
}

const Summary = ({
  operationsCount,
  sender,
  receiver,
  network,
  estimatedFee,
  action,
}: SummaryProps) => {
  const t = useLang();
  const appearance = useAppStore((store) => store.config.appearance);

  const store = useAppStore((store) => store);
  const { setAlert } = store;

  const handleCopyText = (address: string) => {
    copyText(address);
    setAlert('copy', t('address_copied'));
    setTimeout(() => {
      setAlert('none', '');
    }, 1000);
  };

  const details: TransactionDetail[] = [
    { label: t('action'), value: capitalizeFirstLetter(action) },
    { label: t('operations'), value: operationsCount.toString() },
    {
      label: t('sender'),
      value: shortenAddress(sender, 5),
      isHighlighted: true,
      isCopyable: true,
      copyValue: sender,
    },
    { label: t('network'), value: DEFAULT_NETWORKS_TRANSPORTS[network]?.name || network },
    { label: t('estimatedFee'), value: `${estimatedFee} XLM` },
  ];

  if (receiver) {
    details.splice(3, 0, {
      label: t('to'),
      value: shortenAddress(receiver, 5),
      isHighlighted: true,
      isCopyable: true,
      copyValue: receiver,
    });
  }

  return (
    <div
      className="bluxcc:w-full bluxcc:text-sm bluxcc:text-gray-800"
      style={{ fontFamily: appearance.fontFamily }}
    >
      {details.map(
        ({ label, value, isHighlighted, isCopyable, copyValue }, index) => (
          <div
            key={index}
            className="bluxcc:flex bluxcc:justify-between bluxcc:px-4 bluxcc:py-2"
            style={
              index === details.length - 1
                ? {}
                : {
                    borderBottomColor: appearance.borderColor,
                    borderBottomStyle: 'dashed',
                    borderBottomWidth: appearance.borderWidth,
                  }
            }
          >
            <span style={{ color: appearance.textColor }}>{label}</span>
            {isCopyable ? (
              <button
                id="bluxcc-button"
                className="bluxcc:bg-transparent"
                style={{
                  color: isHighlighted
                    ? appearance.accentColor
                    : appearance.textColor,
                }}
                onClick={() => copyValue && handleCopyText(copyValue)}
              >
                {value}
              </button>
            ) : (
              <span
                style={{
                  color: isHighlighted
                    ? appearance.accentColor
                    : appearance.textColor,
                }}
              >
                {value}
              </span>
            )}
          </div>
        ),
      )}
    </div>
  );
};

export default Summary;
