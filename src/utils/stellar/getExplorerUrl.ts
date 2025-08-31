import { IExplorer } from "../../types";
import { DEFAULT_NETWORKS_TRANSPORTS } from "../../constants/networkDetails";

const getExplorerUrl = (
  networkPassphrase: string,
  explorerProvider: IExplorer,
  endpoint: "accountUrl" | "transactionUrl" | "operationUrl" | "ledgerUrl",
  value: string
): string | null => {
  let explorer = DEFAULT_NETWORKS_TRANSPORTS[explorerProvider];

  if (!explorer) {
    explorer = DEFAULT_NETWORKS_TRANSPORTS.stellarchain;
  }

  let networkExplorer = DEFAULT_NETWORKS_TRANSPORTS[networkPassphrase];

  if (!networkExplorer) {
    return null;
  }

  return `${networkExplorer}/${DEFAULT_NETWORKS_TRANSPORTS[endpoint]}/${value}`;
};

export default getExplorerUrl;
