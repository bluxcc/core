import { hotConfig } from "./hot";
import { IWallet } from "../types";
import { hanaConfig } from "./hana";
import { rabetConfig } from "./rabet";
import { xBullConfig } from "./xbull";
import { albedoConfig } from "./albedo";
import { lobstrConfig } from "./lobstr";
import { kleverConfig } from "./klever";
import { SupportedWallet } from "../enums";
import { freighterConfig } from "./freighter";

export const walletsConfig: Record<SupportedWallet, IWallet> = {
  [SupportedWallet.Rabet]: rabetConfig,
  [SupportedWallet.Freighter]: freighterConfig,
  [SupportedWallet.Hana]: hanaConfig,
  [SupportedWallet.Lobstr]: lobstrConfig,
  [SupportedWallet.Albedo]: albedoConfig,
  [SupportedWallet.Xbull]: xBullConfig,
  [SupportedWallet.Hot]: hotConfig,
  [SupportedWallet.Klever]: kleverConfig,
};
