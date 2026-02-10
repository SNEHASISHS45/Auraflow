import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  increment,
  doc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Wallpaper, AppComment } from '../types';
import { MOCK_WALLPAPERS } from '../constants';

const COLLECTION_NAME = 'wallpapers';

export const dbService = {
  async saveWallpaper(wallpaper: Wallpaper): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...wallpaper,
        createdAt: serverTimestamp(),
        visibility: wallpaper.visibility || 'public',
        // Ensure some fields are numeric for easier sorting/filtering if needed
        views: 0,
        downloads: 0,
        likes: 0
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving wallpaper:", error);
      throw error;
    }
  },

  async getAllWallpapers(): Promise<Wallpaper[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const cloudItems = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((wp: any) => wp.visibility !== 'private') as Wallpaper[];

      // Combine cloud uploads with mock wallpapers
      return [...cloudItems, ...MOCK_WALLPAPERS];
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.error("🔥 Firestore Permission Denied! Update your security rules in the Firebase console.");
      }
      console.error("Error getting wallpapers:", error);
      return MOCK_WALLPAPERS; // Fallback to mocks
    }
  },

  async getUserWallpapers(userId: string): Promise<Wallpaper[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("authorId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];
    } catch (error) {
      console.error("Error getting user wallpapers:", error);
      return [];
    }
  },

  async updateWallpaper(id: string, updates: Partial<Wallpaper>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating wallpaper:", error);
      throw error;
    }
  },

  async deleteWallpaper(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting wallpaper:", error);
      throw error;
    }
  },

  async getNotifications(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'notifications'),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  },

  async saveNotification(notification: any): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: serverTimestamp(),
        isRead: false
      });
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  },

  async addComment(comment: Partial<AppComment>): Promise<void> {
    try {
      await addDoc(collection(db, 'comments'), {
        ...comment,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  async getComments(wallpaperId: string): Promise<AppComment[]> {
    try {
      const q = query(
        collection(db, 'comments'),
        where("wallpaperId", "==", wallpaperId)
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppComment[];

      return items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } catch (error) {
      console.error("Error getting comments:", error);
      return [];
    }
  },

  async incrementStats(wallpaperId: string, field: 'views' | 'downloads' | 'likes'): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, wallpaperId);
      await updateDoc(docRef, {
        [field]: increment(1)
      });
    } catch (error) {
      console.error("Error incrementing stats:", error);
    }
  }
};
