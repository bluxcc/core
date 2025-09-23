import { Asset } from "@stellar/stellar-sdk";
import { AccountCallBuilder } from "@stellar/stellar-sdk/lib/horizon/account_call_builder";
import { ClaimableBalanceCallBuilder } from "@stellar/stellar-sdk/lib/horizon/claimable_balances_call_builder";
import { LedgerCallBuilder } from "@stellar/stellar-sdk/lib/horizon/ledger_call_builder";
import { PathCallBuilder } from "@stellar/stellar-sdk/lib/horizon/path_call_builder";
import { LiquidityPoolCallBuilder } from "@stellar/stellar-sdk/lib/horizon/liquidity_pool_call_builder";
import { OperationCallBuilder } from "@stellar/stellar-sdk/lib/horizon/operation_call_builder";
import { OrderbookCallBuilder } from "@stellar/stellar-sdk/lib/horizon/orderbook_call_builder";
import { OfferCallBuilder } from "@stellar/stellar-sdk/lib/horizon/offer_call_builder";
import { TransactionCallBuilder } from "@stellar/stellar-sdk/lib/horizon/transaction_call_builder";
import { TradesCallBuilder } from "@stellar/stellar-sdk/lib/horizon/trades_call_builder";
import { TradeAggregationCallBuilder } from "@stellar/stellar-sdk/lib/horizon/trade_aggregation_call_builder";
import { EffectCallBuilder } from "@stellar/stellar-sdk/lib/horizon/effect_call_builder";
import { PaymentCallBuilder } from "@stellar/stellar-sdk/lib/horizon/payment_call_builder";
import { AssetsCallBuilder } from "@stellar/stellar-sdk/lib/horizon/assets_call_builder";

import { CallBuilderOptions, getNetwork } from "../utils";

type CallBuilderMap = {
  accounts: [[], AccountCallBuilder];
  claimableBalances: [[], ClaimableBalanceCallBuilder];
  ledgers: [[], LedgerCallBuilder];
  transactions: [[], TransactionCallBuilder];
  offers: [[], OfferCallBuilder];
  orderbook: [[selling: Asset, buying: Asset], OrderbookCallBuilder];
  trades: [[], TradesCallBuilder];
  operations: [[], OperationCallBuilder];
  liquidityPools: [[], LiquidityPoolCallBuilder];
  strictReceivePaths: [
    [
      source: string | Asset[],
      destinationAsset: Asset,
      destinationAmount: string,
    ],
    PathCallBuilder,
  ];
  strictSendPaths: [
    [sourceAsset: Asset, sourceAmount: string, destination: string | Asset[]],
    PathCallBuilder,
  ];
  payments: [[], PaymentCallBuilder];
  effects: [[], EffectCallBuilder];
  assets: [[], AssetsCallBuilder];
  tradeAggregation: [
    [
      base: Asset,
      counter: Asset,
      start_time: number,
      end_time: number,
      resolution: number,
      offset: number,
    ],
    TradeAggregationCallBuilder,
  ];
};

export const callBuilder = <C extends keyof CallBuilderMap>(
  callName: C,
  args: CallBuilderMap[C][0],
  params: CallBuilderOptions,
): CallBuilderMap[C][1] => {
  const { horizon } = getNetwork(params.network);

  // @ts-ignore
  let call = horizon[callName](...args);

  if (params.cursor) {
    call.cursor(params.cursor);
  }

  if (params.limit) {
    call.limit(params.limit);
  }

  if (params.order) {
    call.order(params.order);
  }

  return call;
};
