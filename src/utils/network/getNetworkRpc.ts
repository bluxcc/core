import { url } from "./url";
import { ITransports } from "../../types";
import {
  INetworkTransports,
  DEFAULT_NETWORKS_TRANSPORTS,
} from "../../constants/networkDetails";

const getNetworkRpc = (
  network: string,
  transports: ITransports
): INetworkTransports => {
  let details = DEFAULT_NETWORKS_TRANSPORTS[network];

  const transport = transports[network];

  if (!details && !transport) {
    throw new Error("Custom network has no transports.");
  } else if (!details && transport) {
    details = {
      name: "Custom Network",
      horizon: url(""),
      soroban: url(""),
    };
  }

  if (transport) {
    if (transport.horizon) {
      details.horizon = transport.horizon;
    }

    if (transport.soroban) {
      details.soroban = transport.soroban;
    }
  }

  return details;
};

export default getNetworkRpc;
