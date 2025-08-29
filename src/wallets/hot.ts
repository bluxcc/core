// import { HOT } from "@hot-wallet/sdk";
// import { IWallet, SupportedWallet } from "../types";
//
// export const hotConfig: IWallet = {
//   name: SupportedWallet.Hot,
//   website: "https://hot-labs.org/",
//
//   isAvailable: () => {
//     return typeof window !== "undefined" && !!window.hotExtension;
//   },
//
//   connect: async () => {
//     try {
//       const result = await HOT.request("stellar:getAddress", {});
//
//       return { publicKey: result.address };
//     } catch {
//       throw new Error("Failed to connect to Hana wallet.");
//     }
//   },
//
//   signTransaction: async (
//     xdr: string,
//     options: { address?: string; networkPassphrase?: string } = {},
//   ): Promise<string> => {
//     try {
//       const result = await HOT.request("stellar:signTransaction", {
//         xdr,
//         accountToSign: options.address,
//       });
//
//       return result.signedTxXdr;
//     } catch {
//       throw new Error("Failed to sign the transaction with Hana wallet.");
//     }
//   },
//   getNetwork: async () => {
//     throw new Error("Failed to get network from HOT");
//   },
// };
