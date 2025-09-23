import { getState } from "../../store";

const getNetwork = () => {
  const store = getState();

  if (store.config.networks.length === 0) {
    throw new Error("getNetwork must be called after createConfig");
  }

  return store.stellar?.activeNetwork || "";
};

export default getNetwork;
