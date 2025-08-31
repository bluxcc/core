import htm from "htm";
import { h } from "preact";
import getExplorerUrl from "../../../utils/stellar/getExplorerUrl";
import {
  Globe,
  Upstream,
  Downstream,
  MultiOperation,
} from "../../../assets/Icons";
import formatDate from "../../../utils/formatDate";
import { IAppearance } from "../../../types";
import { networks } from "../../../constants/networkDetails";

const html = htm.bind(h);

export type TxDetail = {
  hash: string;
  date: string;
  title: string;
  description: string;
};

interface TransactionProps {
  tx: TxDetail;
  appearance: IAppearance;
}

export function History({ tx, appearance }: TransactionProps) {
  // todo     context.value.activeNetwork, context.value.config.explorer,
  const explorerUrl = getExplorerUrl(
    networks.mainnet,
    "lumenscan",
    "transactionUrl",
    tx.hash
  );

  const handleActionLogo = (action: string) => {
    switch (action) {
      case "Receive":
        return html`<${Downstream} />`;
      case "Send":
        return html`<${Upstream} />`;
      default:
        return html`<${MultiOperation} />`;
    }
  };

  const handleGoToExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, "_blank", "noopener,noreferrer");
    }
  };

  return html`
    <div class="bluxcc:flex bluxcc:items-center bluxcc:justify-between">
      <div
        class="bluxcc:flex bluxcc:items-center bluxcc:justify-start bluxcc:gap-3"
      >
        <div
          class="bluxcc:flex bluxcc:size-10 bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full"
          style=${{ backgroundColor: appearance.background }}
        >
          ${handleActionLogo(tx.title)}
        </div>
        <div class="bluxcc:flex bluxcc:flex-col bluxcc:justify-start">
          <p
            class="bluxcc:text-start bluxcc:text-xs bluxcc:font-medium"
            style=${{ color: appearance.textColor }}
          >
            ${tx.title}
          </p>
          <p class="bluxcc:text-sm bluxcc:font-medium">${tx.description}</p>
        </div>
      </div>
      <div
        class="bluxcc:flex bluxcc:items-center bluxcc:gap-2 bluxcc:text-xs bluxcc:text-gray-600"
      >
        ${formatDate(tx.date)}
        <div
          class="bluxcc:flex bluxcc:size-8 bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full"
          title="View transaction details"
          onClick=${handleGoToExplorer}
          style=${{ backgroundColor: appearance.fieldBackground }}
        >
          <span class="bluxcc:flex bluxcc:items-center bluxcc:justify-center">
            <${Globe} />
          </span>
        </div>
      </div>
    </div>
  `;
}
