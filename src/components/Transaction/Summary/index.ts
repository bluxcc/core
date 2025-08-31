import htm from "htm";
import { h } from "preact";
import copyText from "../../../utils/copyText";
import shortenAddress from "../../../utils/shortenAddress";
import { DEFAULT_NETWORKS_TRANSPORTS } from "../../../constants/networkDetails";
import capitalizeFirstLetter from "../../../utils/capitalizeFirstLetter";
import { IAppearance } from "../../../types";

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
  appearance: IAppearance;
}

const html = htm.bind(h);

export function Summary({
  operationsCount,
  sender,
  receiver,
  network,
  estimatedFee,
  action,
  appearance,
}: SummaryProps) {
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

  return html`
    <div class="bluxcc:w-full bluxcc:text-sm bluxcc:text-gray-800">
      ${details.map(
        ({ label, value, isHighlighted, isCopyable, copyValue }, index) => html`
          <div
            class="bluxcc:flex bluxcc:justify-between bluxcc:px-4 bluxcc:py-2"
            style=${index === details.length - 1
              ? {}
              : {
                  borderBottomColor: appearance.borderColor,
                  borderBottomStyle: "dashed",
                  borderBottomWidth:
                    appearance.outlineWidth ?? appearance.borderWidth,
                }}
            onClick=${() => isCopyable && copyValue && copyText(copyValue)}
          >
            <span style=${{ color: appearance.textColor }}>${label}</span>
            <span
              class=${isCopyable ? "bluxcc:cursor-pointer" : ""}
              style=${{
                color: isHighlighted
                  ? appearance.accentColor
                  : appearance.textColor,
              }}
            >
              ${value}
            </span>
          </div>
        `
      )}
    </div>
  `;
}
