import { Route } from '../../enums';
import { IStore } from '../../store';
import { getSigningWallet } from '../../wallets';
import handleSignAuthEntry from '../handleSignAuthEntry';

const signAuthEntryProcess = async (store: IStore) => {
  const signAuthEntry = store.signAuthEntry;

  if (!signAuthEntry) {
    store.setRoute(Route.FAILED);

    return;
  }

  store.setRoute(Route.WAITING);

  if (!store.user) {
    store.setRoute(Route.FAILED);

    return;
  }

  const wallet = getSigningWallet(store.user, store.wallets);

  if (!wallet) {
    store.setRoute(Route.FAILED);

    return;
  }

  try {
    const result = await handleSignAuthEntry(
      wallet,
      signAuthEntry.authEntry,
      store.user?.address as string,
      signAuthEntry.options.network,
    );

    store.setSignAuthEntry(
      {
        ...signAuthEntry,
        result,
      },
      true,
      Route.WAITING,
    );

    setTimeout(() => {
      store.setRoute(Route.SUCCESSFUL);
    }, 400);
  } catch (cause) {
    setTimeout(() => {
      store.setRoute(Route.FAILED);
    }, 200);
  }
};

export default signAuthEntryProcess;
