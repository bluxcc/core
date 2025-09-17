import getAccount from "./getAccount";
import getAccounts from "./getAccounts";
import getAssets from "./getAssets";
import getBalances from "./getBalances";
import getClaimableBalances from "./getClaimableBalances";
import getEffects from "./getEffects";
import getLedgers from "./getLedgers";
import getLiquidityPools from "./getLiquidityPools";
import getOffers from "./getOffers";
import getOperations from "./getOperations";
import getOrderbook from "./getOrderbook";
import getPayments from "./getPayments";
import getStrictReceivePaths from "./getStrictReceivePaths";
import getStrictSendPaths from "./getStrictSendPaths";
import getTradeAggregation from "./getTradeAggregation";
import getTrades from "./getTrades";
import getTransactions from "./getTransactions";

const query = {
  getAccount,
  getAccounts,
  getAssets,
  getBalances,
  getClaimableBalances,
  getEffects,
  getLedgers,
  getLiquidityPools,
  getOffers,
  getOperations,
  getOrderbook,
  getPayments,
  getStrictReceivePaths,
  getStrictSendPaths,
  getTradeAggregation,
  getTrades,
  getTransactions,
};

export default query;
