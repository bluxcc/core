import React from "react";

import {
  Globe,
  Upstream,
  Downstream,
  MultiOperation,
} from "../../../assets/Icons";
import { useAppStore } from "../../../store";
import { formatDate, getExplorerUrl } from "../../../utils/helpers";

export type TxDetail = {
  hash: string;
  date: string;
  title: string;
  description: string;
};

interface TransactionProps {
  tx: TxDetail;
}

const History = ({ tx }: TransactionProps) => {
  const store = useAppStore((store) => store);

  const explorerUrl = getExplorerUrl(
    store.stellar?.activeNetwork || "something", // todo
    store.config.explorer,
    "transactionUrl",
    tx.hash,
  );

  const handleActionLogo = (action: string) => {
    switch (action) {
      case "Receive":
        return <Downstream />;
      case "Send":
        return <Upstream />;
      default:
        return <MultiOperation />;
    }
  };

  const handleGoToExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-between">
      <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-start bluxcc:gap-3">
        <div
          className={`bluxcc:flex bluxcc:size-10 bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full`}
          style={{
            backgroundColor: store.config.appearance.background,
          }}
        >
          {handleActionLogo(tx.title)}
        </div>
        <div className="bluxcc:flex bluxcc:flex-col bluxcc:justify-start">
          <p
            className="bluxcc:text-start bluxcc:text-xs bluxcc:font-medium"
            style={{ color: store.config.appearance.textColor }}
          >
            {tx.title}
          </p>
          <p className="bluxcc:text-sm bluxcc:font-medium">{tx.description}</p>
        </div>
      </div>
      <div className="bluxcc:flex bluxcc:items-center bluxcc:gap-2 bluxcc:text-xs bluxcc:text-gray-600">
        {formatDate(tx.date)}
        <div
          className="bluxcc:flex bluxcc:size-8 bluxcc:cursor-pointer bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full"
          title="View transaction details"
          onClick={handleGoToExplorer}
          style={{ backgroundColor: store.config.appearance.fieldBackground }}
        >
          <span className="bluxcc:flex bluxcc:items-center bluxcc:justify-center">
            <Globe />
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(History);
