import {
  signInWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import { User } from '../types';

const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  name: firebaseUser.displayName || 'Anonymous',
  username: firebaseUser.email?.split('@')[0] || 'user',
  avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
  bio: 'Aura Creator',
  followers: '0',
  following: '0',
  uploads: 0,
  isElite: false
});

export const authService = {
  async signUp(name: string, email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    });
    return mapFirebaseUserToUser(userCredential.user);
  },

  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUserToUser(userCredential.user);
  },

  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const userCredential = await signInWithPopup(auth, provider);
    return mapFirebaseUserToUser(userCredential.user);
  },

  async signInWithGoogleToken(idToken: string): Promise<User> {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return mapFirebaseUserToUser(userCredential.user);
  },

  async signOut() {
    await firebaseSignOut(auth);
  },

  getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser;
    return firebaseUser ? mapFirebaseUserToUser(firebaseUser) : null;
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        callback(mapFirebaseUserToUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  }
};
