// import { hotConfig } from "./hot";
import { hanaConfig } from "./hana";
import { rabetConfig } from "./rabet";
import { xBullConfig } from "./xbull";
import { albedoConfig } from "./albedo";
import { lobstrConfig } from "./lobstr";
import { freighterConfig } from "./freighter";
import { IWallet, SupportedWallet } from "../types";

export const walletsConfig: Record<SupportedWallet, IWallet> = {
  [SupportedWallet.Rabet]: rabetConfig,
  [SupportedWallet.Freighter]: freighterConfig,
  [SupportedWallet.Hana]: hanaConfig,
  [SupportedWallet.Lobstr]: lobstrConfig,
  [SupportedWallet.Albedo]: albedoConfig,
  [SupportedWallet.Xbull]: xBullConfig,
  // [SupportedWallet.Hot]: hotConfig,
};
