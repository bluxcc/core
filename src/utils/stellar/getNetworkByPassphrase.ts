import { StellarNetwork } from "../../types";

const getNetworkByPassphrase = (passphrase: string) => {
  const networkEntry = Object.entries(StellarNetwork).find(
    ([, value]) => value === passphrase
  );

  if (!networkEntry) {
    throw new Error(`Unknown network passphrase: ${passphrase}`);
  }

  return networkEntry[0].toLowerCase();
};

export default getNetworkByPassphrase;
