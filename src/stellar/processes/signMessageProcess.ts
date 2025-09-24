import { Route } from "../../enums";
import { IStore } from "../../store";
import handleSignMessage from "../handleSignMessage";

const signMessageProcess = async (store: IStore) => {
  const signMessage = store.signMessage;

  if (!signMessage) {
    store.setRoute(Route.FAILED);

    return;
  }

  store.setRoute(Route.WAITING);

  try {
    const result = await handleSignMessage(
      signMessage.wallet,
      signMessage.message,
      store.user?.address as string,
      signMessage.options.network,
    );

    store.setSignMessage(
      {
        ...signMessage,
        result,
      },
      Route.WAITING,
    );

    setTimeout(() => {
      store.setRoute(Route.SUCCESSFUL);
    }, 400);
  } catch {
    setTimeout(() => {
      store.setRoute(Route.FAILED);
    }, 200);
  }
};

export default signMessageProcess;
