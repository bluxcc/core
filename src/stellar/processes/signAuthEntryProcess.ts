import { IStore } from '../../store';
import { walletsConfig } from '../../wallets';
import { Route, SupportedWallet } from '../../enums';
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

  const { authMethod, authValue } = store.user;

  if (authMethod !== 'wallet') {
    store.setRoute(Route.FAILED);

    return;
  }

  const wallet = walletsConfig[authValue as SupportedWallet];

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
