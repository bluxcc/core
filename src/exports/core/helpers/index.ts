/**
 * Shared, hook-free helpers for the interacting core functions. Re-exporting
 * `numberish` here lets a caller pull the address resolver, the asset resolver,
 * and the number coercion from a single place.
 */
export { resolveAsset, type AssetArg } from './resolveAsset';
export {
  resolveAddress,
  resolveAddressKey,
  type ResolvedAddress,
} from './resolveAddress';
export { loadAccount, hasTrustline } from './account';
export { numberish, type Numberish } from '../toScVal';
