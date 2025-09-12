import {
  capitalizeFirstLetter,
  copyText,
  shortenAddress,
} from "../../../utils/helpers";
import { DEFAULT_NETWORKS_TRANSPORTS } from "../../../constants/networkDetails";
import { useAppStore } from "../../../store";

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
  const appearance = useAppStore((store) => store.config.appearance);

  const details: TransactionDetail[] = [
    { label: "Action", value: capitalizeFirstLetter(action) },
    { label: "Operations", value: operationsCount.toString() },
    {
      label: "Sender",
      value: shortenAddress(sender, 5),
      isHighlighted: true,
      isCopyable: true,
      copyValue: sender,
    },
    { label: "Network", value: DEFAULT_NETWORKS_TRANSPORTS[network].name },
    { label: "Estimated Fee", value: `${estimatedFee} XLM` },
  ];

  if (receiver) {
    details.splice(3, 0, {
      label: "To",
      value: shortenAddress(receiver, 5),
      isHighlighted: true,
      isCopyable: true,
      copyValue: receiver,
    });
  }

  return (
    <div className="bluxcc:w-full bluxcc:text-sm bluxcc:text-gray-800">
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
                    borderBottomStyle: "dashed",
                    borderBottomWidth: appearance.borderWidth,
                  }
            }
          >
            <span style={{ color: appearance.textColor }}>{label}</span>
            <span
              className={`${isCopyable ? "bluxcc:cursor-pointer" : ""}`}
              style={{
                color: isHighlighted
                  ? appearance.accentColor
                  : appearance.textColor,
              }}
              onClick={() => isCopyable && copyValue && copyText(copyValue)}
            >
              {value}
            </span>
          </div>
        )
      )}
    </div>
  );
};

export default Summary;
