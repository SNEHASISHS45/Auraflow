
import { Wallpaper } from '../types';
import { MOCK_WALLPAPERS } from '../constants';

const DB_NAME = 'AuraFlowDB';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

class LocalDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async save(wallpaper: Wallpaper): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        ...wallpaper,
        createdAt: new Date().toISOString()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(): Promise<Wallpaper[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const localDB = new LocalDB();

export const dbService = {
  async saveWallpaper(wallpaper: Wallpaper): Promise<void> {
    await localDB.save(wallpaper);
  },

  async getAllWallpapers(): Promise<Wallpaper[]> {
    const localItems = await localDB.getAll();
    // Combine local user uploads with the default mock collection
    return [...localItems, ...MOCK_WALLPAPERS].sort((a, b) => {
      const dateA = (a as any).createdAt || '0';
      const dateB = (b as any).createdAt || '0';
      return dateB.localeCompare(dateA);
    });
  },

  async getUserWallpapers(userId: string): Promise<Wallpaper[]> {
    const all = await localDB.getAll();
    return all.filter(wp => (wp as any).authorId === userId);
  },

  async deleteWallpaper(id: string): Promise<void> {
    await localDB.delete(id);
  }
};
