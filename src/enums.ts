import { Networks } from "@stellar/stellar-sdk";

export enum SupportedWallet {
  Rabet = "Rabet",
  Albedo = "Albedo",
  Freighter = "Freighter",
  Xbull = "xBull",
  Lobstr = "LOBSTR",
  Hana = "Hana",
  // Hot = "Hot",
}

export enum StellarNetwork {
  PUBLIC = Networks.PUBLIC,
  TESTNET = Networks.TESTNET,
  FUTURENET = Networks.FUTURENET,
  SANDBOX = Networks.SANDBOX,
  STANDALONE = Networks.STANDALONE,
}

export enum Route {
  ONBOARDING = "ONBOARDING", // View for selecting a wallet
  WRONG_NETWORK = "WRONG_NETWORK", // View for selecting a wallet
  WAITING = "WAITING", // View for connection process
  SUCCESSFUL = "SUCCESSFUL", // View for connection success process
  PROFILE = "PROFILE", // User profile view
  SEND_TRANSACTION = "SEND_TRANSACTION", // User sign transaction view
  SEND = "SEND", // User sign transaction view
  ACTIVITY = "ACTIVITY", // User sign transaction view
  OTP = "OTP", // User Login with Phone ot email
  RECEIVE = "RECEIVE", // View for receive page
  BALANCES = "BALANCES", // View for balances
  SWAP = "SWAP", // View for swap assets
  BALANCE_DETAILS = "BALANCE_DETAILS", // View for asset details
  ABOUT = "ABOUT", // View for what is blux
}
