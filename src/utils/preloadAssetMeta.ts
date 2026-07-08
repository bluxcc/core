import { Networks } from '@stellar/stellar-sdk';

import { getState } from '../store';
import { AssetMetaMap } from '../types';
import { CLOUDFLARE_R2_ASSET_META } from '../constants/consts';

// Kept in its OWN IndexedDB database (not the `blux-cache` used by
// preloadImages) so the two caches never collide on version numbers.
const DB_NAME = 'blux-asset-meta';
const STORE_NAME = 'meta';
const DB_VERSION = 1;
const RECORD_KEY = 'assets';

/** Shape of the gzipped blob served from R2 (see scripts/asset-meta). */
interface AssetMetaPayload {
  network: string;
  generatedAt: string;
  count: number;
  assets: AssetMetaMap;
}

/** `pubnet` for Mainnet, `testnet` otherwise. The curated blob is Mainnet-only. */
export const networkSlug = (activeNetwork?: string): string =>
  activeNetwork === Networks.PUBLIC ? 'pubnet' : 'testnet';

/** Lookup key into the asset-meta map, e.g. `pubnet:USDC:GA5Z...`. */
export const assetMetaKey = (
  activeNetwork: string | undefined,
  code: string,
  issuer: string,
): string => `${networkSlug(activeNetwork)}:${code}:${issuer}`;

export const preloadAssetMeta = async () => {
  if (getState().assetMeta) return;

  try {
    const cached = await getFromIndexedDb();

    if (cached) {
      getState().setAssetMeta(cached);

      refreshInBackground();

      return;
    }

    const fresh = await fetchAssetMeta();

    getState().setAssetMeta(fresh);

    await storeInIndexedDb(fresh);
  } catch (e) {}
};

const refreshInBackground = async () => {
  try {
    const fresh = await fetchAssetMeta();

    getState().setAssetMeta(fresh);

    await storeInIndexedDb(fresh);
  } catch (err) {}
};

const fetchAssetMeta = async (): Promise<AssetMetaMap> => {
  const res = await fetch(CLOUDFLARE_R2_ASSET_META);

  if (!res.ok) throw new Error(`BLUX: Failed to fetch asset meta: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const payload = (await decompressGzFile(buffer)) as AssetMetaPayload;

  return payload.assets ?? {};
};

// ==================== Helpers ====================

const decompressGzFile = async (arrayBuffer: ArrayBuffer) => {
  const ds = new DecompressionStream('gzip');

  const decompressedStream = new Blob([arrayBuffer]).stream().pipeThrough(ds);

  const decompressedText = await new Response(decompressedStream).text();

  return JSON.parse(decompressedText);
};

const openIndexedDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => reject(request.error);

    request.onblocked = () => {};
  });
};

const storeInIndexedDb = async (assets: AssetMetaMap) => {
  const db = await openIndexedDb();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');

    tx.objectStore(STORE_NAME).put(assets, RECORD_KEY);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getFromIndexedDb = async (): Promise<AssetMetaMap | null> => {
  try {
    const db = await openIndexedDb();

    return await new Promise<AssetMetaMap | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(RECORD_KEY);

      request.onsuccess = () => {
        const val = request.result as AssetMetaMap | undefined;

        resolve(val && Object.keys(val).length ? val : null);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    return null;
  }
};
