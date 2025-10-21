import { getState as getStoreState } from '../store';

export * from './core';
export { blux } from './blux';
export {
  getState,
  subscribe,
  getInitialState,
  useExportedStore,
} from './exportedStore';
export const setAppearance = getStoreState().setAppearance;
