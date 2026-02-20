import React from 'react';

import CDNImage from '../../CDNImage';
import { useAppStore } from '../../../store';
import CDNFiles from '../../../constants/cdnFiles';
import { formatDate, getExplorerUrl, hexToRgba } from '../../../utils/helpers';

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
  const appearance = store.config.appearance;

  const explorerUrl = getExplorerUrl(
    store.stellar?.activeNetwork || '',
    store.config.explorer,
    'transactionUrl',
    tx.hash,
  );

  const handleActionLogo = (action: string) => {
    switch (action) {
      case 'Receive':
        return <CDNImage name={CDNFiles.Downstream} />;
      case 'Send':
        return <CDNImage name={CDNFiles.Upstream} />;
      default:
        return <CDNImage name={CDNFiles.MultiOperation} />;
    }
  };

  const handleGoToExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-between">
      <div className="bluxcc:flex bluxcc:items-center bluxcc:justify-start bluxcc:gap-3">
        <div
          className={`bluxcc:flex bluxcc:size-10 bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full`}
          style={{
            background: appearance.background,
          }}
        >
          {handleActionLogo(tx.title)}
        </div>
        <div className="bluxcc:flex bluxcc:flex-col bluxcc:justify-start">
          <p
            className="bluxcc:text-start bluxcc:text-xs bluxcc:font-medium"
            style={{ color: appearance.textColor }}
          >
            {tx.title}
          </p>
          <p className="bluxcc:text-sm bluxcc:font-medium">{tx.description}</p>
        </div>
      </div>
      <div
        className="bluxcc:flex bluxcc:items-center bluxcc:gap-2 bluxcc:text-xs"
        style={{ color: hexToRgba(appearance.textColor, 0.7) }}
      >
        {formatDate(tx.date)}
        <button
          id="bluxcc-button"
          className="bluxcc:flex bluxcc:size-8 bluxcc:items-center bluxcc:justify-center bluxcc:rounded-full"
          title="View transaction details"
          onClick={handleGoToExplorer}
          style={{ background: appearance.fieldBackground }}
        >
          <span className="bluxcc:flex bluxcc:items-center bluxcc:justify-center">
            <CDNImage name={CDNFiles.Globe} />;
          </span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(History);
