import { Horizon } from "@stellar/stellar-sdk";
import React, { useEffect, useState } from "react";

import { useAppStore } from "../../../store";
import Button from "../../../components/Button";
import { useLang } from "../../../hooks/useLang";
import useTransactions from "../../../hooks/useTransactions";
import {
  getExplorerUrl,
  hexToRgba,
  humanizeAmount,
  toTitleFormat,
} from "../../../utils/helpers";
import History, { TxDetail } from "../../../components/Transaction/History";

const handleAssetText = (
  op: Horizon.ServerApi.PaymentOperationRecord | any
) => {
  if (op.asset_type === "native") {
    return "XLM";
  }
  return op.asset_code || "Pool";
};

const Activity = () => {
  const t = useLang();
  const store = useAppStore((store) => store);
  const { transactions, loading } = useTransactions();
  const [transactionsDetails, setTransactionsDetails] = useState<TxDetail[]>(
    []
  );
  const appearance = store.config.appearance;
  const userAddress = store.user?.address as string;
  const explorerUrl = getExplorerUrl(
    store.stellar?.activeNetwork as string,
    store.config.explorer,
    "accountUrl",
    userAddress
  );

  const handleGoToExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, "_blank", "noopener,noreferrer");
    }
  };

  useEffect(() => {
    if (!transactions) {
      return;
    }

    const result: TxDetail[] = [];

    for (const tx of transactions) {
      const op = tx.operations[0];

      const details: TxDetail = {
        hash: tx.hash,
        description: "",
        date: tx.created_at,
        title: toTitleFormat(op.type),
      };

      if (tx.operations.length > 1) {
        details.title = t("multiOperation");
      } else if (op.type === "payment") {
        let title = t("send");

        if (op.to.toLowerCase() === userAddress.toLowerCase()) {
          title = t("receive");
        }

        details.title = title;
        details.description = `${humanizeAmount(op.amount)} ${handleAssetText(
          op
        )}`;
      } else if (
        op.type ===
          Horizon.HorizonApi.OperationResponseType.pathPaymentStrictSend ||
        op.type === Horizon.HorizonApi.OperationResponseType.pathPayment
      ) {
        console.log(op);
        details.title = t("swap");
        details.description = `Received ${op.amount} ${handleAssetText(op)}`;
      }

      result.push(details);
    }

    setTransactionsDetails(result);
  }, [transactions]);

  const isEmpty = !loading && transactionsDetails.length === 0;

  return (
    <div className="bluxcc:flex bluxcc:h-[355px] bluxcc:flex-col">
      {loading ? (
        <div
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          className="bluxcc:flex bluxcc:h-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:text-center"
        >
          {t("loadingActivity")}
        </div>
      ) : isEmpty ? (
        <div
          style={{ color: hexToRgba(appearance.textColor, 0.7) }}
          className="bluxcc:flex bluxcc:h-full bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:text-center"
        >
          {t("noActivityFound")}
        </div>
      ) : (
        transactionsDetails.map((tx, index) => (
          <div
            key={index}
            style={{
              borderBottomStyle: "dashed",
              borderBottomWidth:
                index < transactionsDetails.length - 1
                  ? appearance.borderWidth
                  : "0px",
              borderBottomColor: appearance.borderColor,
            }}
            className={`bluxcc:p-2`}
          >
            <History tx={tx} />
          </div>
        ))
      )}

      {transactionsDetails.length > 0 && explorerUrl && (
        <div className="bluxcc:absolute bluxcc:bottom-4 bluxcc:left-1/2 bluxcc:!mt-4 bluxcc:w-[calc(100%-3rem)] bluxcc:-translate-x-1/2 bluxcc:transform">
          <Button
            state="enabled"
            variant="outline"
            size="medium"
            onClick={handleGoToExplorer}
          >
            {t("seeAllInExplorer")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Activity;
