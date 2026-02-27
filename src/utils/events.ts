import type { IUser } from '../store';
import type { SendTransactionResult } from '../types';

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
  Login = 'blux:login', // emitted after successful login (payload: { user })
  LoginStarted = 'blux:login_started', // emitted when interactive login flow begins
  LoginFailed = 'blux:login_failed', // emitted when login fails (payload: IErrorPayload)
  Logout = 'blux:logout', // emitted on logout
  NetworkChanged = 'blux:network_changed', // payload: INetwork
  ModalOpened = 'blux:modal_opened', // payload: { modal: string; reason?: string; meta?: any }
  ModalClosed = 'blux:modal_closed', // payload: { modal: string; reason?: string }
  // ProfileSendInitiated = 'blux:profile_send_initiated', // payload: { token: IToken; to: string; amount: string }
  // ProfileSendSucceeded = 'blux:profile_send_succeeded', // payload: ITransaction
  // ProfileSendFailed = 'blux:profile_send_failed', // payload: IErrorPayload
  //
  // ProfileSwapInitiated = 'blux:profile_swap_initiated', // payload: ISwapDetails
  // ProfileSwapSucceeded = 'blux:profile_swap_succeeded', // payload: ITransaction & { swap: ISwapDetails }
  // ProfileSwapFailed = 'blux:profile_swap_failed', // payload: IErrorPayload & { swap?: ISwapDetails }
  //
  // // ApprovalRequested = 'blux:approval_requested', // payload: { token: IToken; spender: string; amount?: string }
  // // ApprovalSucceeded = 'blux:approval_succeeded', // payload: { token: IToken; spender: string }
  // // ApprovalFailed = 'blux:approval_failed', // payload: IErrorPayload
  //
  SignMessageRequested = 'blux:sign_message_requested', // payload: { message: string; meta?: any }
  SignMessageSucceeded = 'blux:sign_message_succeeded', // payload: { signature: string; meta?: any }
  SignMessageFailed = 'blux:sign_message_failed', // payload: IErrorPayload
  //
  SignTransactionRequested = 'blux:sign_transaction_requested', // payload: { tx: Partial<ITransaction>; meta?: any }
  TransactionSigned = 'blux:transaction_signed', // payload: ITransaction
  TransactionSubmitted = 'blux:transaction_submitted', // payload: ITransaction
  // TransactionConfirmed = 'blux:transaction_confirmed', // payload: ITransaction
  TransactionFailed = 'blux:transaction_failed', // payload: IErrorPayload & { tx?: Partial<ITransaction> }
  //
  // Info = 'blux:info', // small informational events (payload: { message: string; meta?: any })
}

export type BluxEventMap = {
  [BluxEvent.Login]: { user: IUser };
  [BluxEvent.LoginStarted]: {
    method: 'wallet' | 'email' | 'silent' | 'unknown';
    authValue?: string;
  };
  [BluxEvent.LoginFailed]: IErrorPayload;
  [BluxEvent.Logout]: void;
  [BluxEvent.NetworkChanged]: INetwork;
  [BluxEvent.ModalOpened]: { modal: string; reason?: string; meta?: any };
  [BluxEvent.ModalClosed]: { modal: string; reason?: string; meta?: any };
  //
  // [BluxEvent.ProfileSendInitiated]: {
  //   token: IToken;
  //   to: string;
  //   amount: string;
  // };
  // [BluxEvent.ProfileSendSucceeded]: ITransaction;
  // [BluxEvent.ProfileSendFailed]: IErrorPayload;
  //
  // [BluxEvent.ProfileSwapInitiated]: ISwapDetails;
  // [BluxEvent.ProfileSwapSucceeded]: ITransaction & { swap: ISwapDetails };
  // [BluxEvent.ProfileSwapFailed]: IErrorPayload & { swap?: ISwapDetails };
  //
  // [BluxEvent.ApprovalRequested]: {
  //   token: IToken;
  //   spender: string;
  //   amount?: string;
  // };
  // [BluxEvent.ApprovalSucceeded]: { token: IToken; spender: string };
  // [BluxEvent.ApprovalFailed]: IErrorPayload;
  //
  [BluxEvent.SignMessageRequested]: { message: string; network: string };
  [BluxEvent.SignMessageSucceeded]: {
    signature: string;
    message: string;
    network: string;
  };
  [BluxEvent.SignMessageFailed]: IErrorPayload & {
    messageToSign?: string;
    network?: string;
  };
  //
  [BluxEvent.SignTransactionRequested]: {
    xdr: string;
    network: string;
    shouldSubmit: boolean;
  };
  [BluxEvent.TransactionSigned]: {
    signedXdr: string;
    xdr: string;
    network: string;
  };
  [BluxEvent.TransactionSubmitted]: {
    result: SendTransactionResult;
    xdr: string;
    network: string;
  };
  // [BluxEvent.TransactionConfirmed]: ITransaction;
  [BluxEvent.TransactionFailed]: IErrorPayload & {
    xdr?: string;
    network?: string;
    shouldSubmit?: boolean;
  };
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
