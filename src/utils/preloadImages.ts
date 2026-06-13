import { ILogo, getState } from '../store';
import { CLOUDFLARE_R2_LOGOS } from '../constants/consts';

const DB_NAME = 'blux-cache';
const STORE_NAME = 'logos';
const DB_VERSION = 1;

const getLogosFromIndexedDB = async (): Promise<ILogo[] | null> => {
  try {
    const db = await openIndexedDb();
    const logos = await getFromIndexedDb(db);

    return logos.length ? logos : null;
  } catch (err) {
    return null;
  }
};

const fetchLogosFromCloudflare = async (): Promise<ILogo[]> => {
  const fileBuffer = await getLogosFromCloudflare(CLOUDFLARE_R2_LOGOS);
  const files = await decompressGzFile(fileBuffer);

  return files.files as ILogo[];
};

export const preloadLogos = async () => {
  const logos = getState().logos;

  if (logos && logos.length > 0) return;

  try {
    const cachedLogos = await getLogosFromIndexedDB();

    if (cachedLogos) {
      getState().setLogos(cachedLogos);

      refreshLogosInBackground();

      return;
    }

    const freshLogos = await fetchLogosFromCloudflare();

    getState().setLogos(freshLogos);

    const db = await openIndexedDb();

    await storeInIndexedDb(db, freshLogos);
  } catch (e) { }
};

const refreshLogosInBackground = async () => {
  try {
    const freshLogos = await fetchLogosFromCloudflare();

    const db = await openIndexedDb();

    await storeInIndexedDb(db, freshLogos);
  } catch (err) { }
};

const getLogosFromCloudflare = async (url: string): Promise<ArrayBuffer> => {
  const res = await fetch(url);

  if (!res.ok) throw new Error(`BLUX: Failed to fetch: ${res.status}`);

  return await res.arrayBuffer();
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
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (_) => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    request.onblocked = (_) => { };
  });
};

const storeInIndexedDb = async (db: IDBDatabase, logos: ILogo[]) => {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.clear();

    logos.forEach((logo) => store.put(logo));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getFromIndexedDb = async (db: IDBDatabase): Promise<ILogo[]> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => reject(request.error);
  });
};
