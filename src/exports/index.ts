import { getState as getStoreState } from '../store';
import { BluxEventMap, ReadOnlyEmitter } from '../utils/events';

export { Asset } from '@stellar/stellar-sdk';
export * from './core';
export { blux } from './blux';
export { BluxEvent } from '../utils/events';
export {
  getState,
  subscribe,
  getInitialState,
  useExportedStore,
} from './exportedStore';
export const setAppearance = getStoreState().setAppearance;

export const events: ReadOnlyEmitter<BluxEventMap> = {
  on: (event, handler) => getStoreState().emitter.on(event, handler),
  off: (event, handler) => getStoreState().emitter.off(event, handler),
  once: (event, handler) => getStoreState().emitter.once(event, handler),
};
