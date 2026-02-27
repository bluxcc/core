import { Networks } from '@stellar/stellar-sdk';

export enum SupportedWallet {
  Api = 'API',
  Rabet = 'Rabet',
  Albedo = 'Albedo',
  Freighter = 'Freighter',
  Xbull = 'xBull',
  Lobstr = 'LOBSTR',
  Hana = 'Hana',
  WalletConnect = 'Wallet Connect',
  Hot = 'Hot',
  Klever = 'Klever',
  Ledger = 'Ledger',
}

export enum StellarNetwork {
  PUBLIC = Networks.PUBLIC,
  TESTNET = Networks.TESTNET,
  FUTURENET = Networks.FUTURENET,
  SANDBOX = Networks.SANDBOX,
  STANDALONE = Networks.STANDALONE,
}

export enum Route {
  ONBOARDING = 'ONBOARDING', // View for selecting a wallet
  WRONG_NETWORK = 'WRONG_NETWORK', // View for selecting a wallet
  WAITING = 'WAITING', // View for connection process
  SUCCESSFUL = 'SUCCESSFUL', // View for connection success process
  FAILED = 'FAILED',
  PROFILE = 'PROFILE', // User profile view
  SEND_TRANSACTION = 'SEND_TRANSACTION', // User sign transaction view
  SEND = 'SEND', // User sign transaction view
  ACTIVITY = 'ACTIVITY', // User sign transaction view
  OTP = 'OTP', // User Login with Phone ot email
  RECEIVE = 'RECEIVE', // View for receive page
  BALANCES = 'BALANCES', // View for balances
  SWAP = 'SWAP', // View for swap assets
  BALANCE_DETAILS = 'BALANCE_DETAILS', // View for asset details
  ABOUT = 'ABOUT', // View for what is blux
  ADD_TOKEN = 'ADD_TOKEN', // View for adding new token
  SIGN_MESSAGE = 'SIGN_MESSAGE', // User sign message view
  WALLET_CONNECT = 'WALLET_CONNECT', // User sign message view
  SELECT_ASSET = 'SELECT_ASSET',
}

export enum CDNPreloadImages {
  // Blux = 'blux.svg',
  // SmallBlux = 'smallblux.svg',
  // About = 'about.svg',
  // ArrowRight = 'arrowright.svg',
  // ArrowLeft = 'arrowleft.svg',
  // Close = 'close.svg',
  // Loading = 'loading.svg',
  // Search = 'search.svg',
  // GreenCheck = 'greencheck.svg',
  // LogOut = 'logout.svg',
  // Copy = 'copy.svg',
  // LargeCopy = 'largecopy.svg',
  // History = 'history.svg',
  // Send = 'send.svg',
  // ArrowDropUp = 'arrowdropup.svg',
  // ArrowDropDown = 'arrowdropdown.svg',
  // RedAlert = 'redalert.svg',
  // Upstream = 'upstream.svg',
  // MultiOperation = 'multioperation.svg',
  // Downstream = 'downstream.svg',
  // Globe = 'globe.svg',
  SmallEmail = 'smallemail.svg',
  Email = 'email.svg',
  // RedExclamation = 'redexclamation.svg',
  // WrongNetwork = 'wrongnetwork.svg',
  // Swap = 'swap.svg',
  // SmallSwap = 'smallswap.svg',
  // Receive = 'receive.svg',
  // Balances = 'balances.svg',
  // NFTs = 'nfts.svg',
  // Assets = 'assets.svg',
  // Token = 'token.svg',
  // Plus = 'plus.svg',
  // OpenEye = 'openeye.svg',
  // CloseEye = 'closeeye.svg',
  // Warn = 'warn.svg',
  // Error = 'error.svg',
  // CopyIcon = 'copyicon.svg',
  // Success = 'success.svg',
  // Key = 'key.svg',
  // Chip = 'chip.svg',
  // Shield = 'shield.svg',
  // Wallet = 'wallet.svg',
  // QuestionMark = 'questionmark.svg',
  // SmallQuestionMark = 'smallquestionmark.svg',
  // GrayCube = 'graycube.svg',
  Albedo = 'albedo.svg',
  // Hana = 'hana.svg',
  // Hot = 'hot.svg',
  // Rabet = 'rabet.svg',
  // Freighter = 'freighter.svg',
  // DarkFreighter = 'darkfreighter.svg',
  // XBull = 'xbull.svg',
  // Lobstr = 'lobstr.svg',
  Stellar = 'stellar.svg',
  // StellarSmall = 'stellarsmall.svg',
  // Google = 'google.svg',
  // WalletConnect = 'walletconnect.svg',
  // Klever = 'klever.svg',
  // Ledger = 'ledger.svg',
}
