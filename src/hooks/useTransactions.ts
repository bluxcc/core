import { useState, useEffect } from "react";
import { Horizon } from "@stellar/stellar-sdk";

import { useAppStore } from "../store";
import getTransactions from "../query/getTransactions";

interface TransactionRecordWithOperations
  extends Omit<Horizon.ServerApi.TransactionRecord, "operations"> {
  operations: Horizon.ServerApi.OperationRecord[];
}

export type UseTransactionsResult = {
  loading: boolean;
  error: Error | null;
  transactions: TransactionRecordWithOperations[];
};

const useTransactions = (): UseTransactionsResult => {
  const store = useAppStore((store) => store);
  const [result, setResult] = useState<UseTransactionsResult>({
    error: null,
    loading: true,
    transactions: [],
  });

  const userAddress = store.user?.address as string;

  useEffect(() => {
    setResult({
      error: null,
      loading: true,
      transactions: [],
    });

    getTransactions({
      limit: 5,
      forAccount: userAddress,
    })
      .then((result) => {
        const txs = result.response;

        const operationsBuilder: Promise<
          Horizon.ServerApi.CollectionPage<Horizon.ServerApi.OperationRecord>
        >[] = [];

        for (const tx of txs.records) {
          operationsBuilder.push(tx.operations());
        }

        Promise.all(operationsBuilder).then((operations) => {
          const transactionsWithOps = txs.records.map((x, i) => ({
            ...x,
            operations: operations[i].records,
          }));

          setResult({
            error: null,
            loading: false,
            transactions:
              transactionsWithOps as TransactionRecordWithOperations[],
          });
        });
      })
      .catch((err) => {
        setResult({
          error: err,
          loading: false,
          transactions: [],
        });
      });
  }, [userAddress, store.stellar?.activeNetwork]);

  return result;
};

export default useTransactions;
