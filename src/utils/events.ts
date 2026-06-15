import type { IUser } from '../store';

export type IErrorPayload = {
  message: string;
  code?: string | number;
  cause?: unknown;
};

export type INetwork = {
  previousNetwork: string;
  network: string;
};

export enum BluxEvent {
  LoggedIn = 'blux:logged_in',
  LoggedOut = 'blux:logged_out',
  NetworkChanged = 'blux:network_changed', // payload: INetwork
  ModalOpened = 'blux:modal_opened', // payload: { modal: string; reason?: string; meta?: any }
  ModalClosed = 'blux:modal_closed', // payload: { modal: string; reason?: string }
}

export type BluxEventMap = {
  [BluxEvent.LoggedIn]: { user: IUser };
  [BluxEvent.LoggedOut]: void;
  [BluxEvent.NetworkChanged]: INetwork;
  [BluxEvent.ModalOpened]: { modal: string; reason?: string; meta?: any };
  [BluxEvent.ModalClosed]: { modal: string; reason?: string; meta?: any };
  // [BluxEvent.TransactionSubmitted]: {
  //   result: SendTransactionResult;
  //   xdr: string;
  //   network: string;
  // };
  // // [BluxEvent.TransactionConfirmed]: ITransaction;
  // [BluxEvent.TransactionFailed]: IErrorPayload & {
  //   xdr?: string;
  //   network?: string;
  //   shouldSubmit?: boolean;
  // };
  //
  // [BluxEvent.Info]: { message: string; meta?: any };
};

export type ReadOnlyEmitter<E> = {
  on: <K extends keyof E>(
    event: K,
    handler: (payload: E[K]) => void,
  ) => () => void;

  once: <K extends keyof E>(
    event: K,
    handler: (payload: E[K]) => void,
  ) => () => void;

  off: <K extends keyof E>(event: K, handler: (payload: E[K]) => void) => void;
};

type Handler<T> = (payload: T) => void;

class Emitter<Events extends Record<string, any>> {
  private handlers = new Map<keyof Events, Set<Function>>();

  on<K extends keyof Events>(
    event: K,
    handler: Handler<Events[K]>,
  ): () => void {
    const set = this.handlers.get(event) ?? new Set<Function>();
    set.add(handler);
    this.handlers.set(event, set);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this.handlers.delete(event);
  }

  once<K extends keyof Events>(
    event: K,
    handler: Handler<Events[K]>,
  ): () => void {
    const wrapper = (payload: Events[K]) => {
      try {
        handler(payload);
      } finally {
        this.off(event, wrapper as any);
      }
    };
    return this.on(event, wrapper as any);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of Array.from(set)) {
      try {
        (h as Handler<Events[K]>)(payload);
      } catch (err) { }
    }
  }

  clear(event?: keyof Events) {
    if (event) this.handlers.delete(event);
    else this.handlers.clear();
  }
}

export default Emitter;
