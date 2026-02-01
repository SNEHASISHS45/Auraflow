
import { User } from '../types';

const AUTH_KEY = 'aura_flow_user';

export const authService = {
  async signUp(name: string, email: string, password: string): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      username: email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      bio: 'New Aura Creator',
      followers: '0',
      following: '0',
      uploads: 0,
      isElite: false
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  async signIn(email: string, password: string): Promise<User> {
    // Simulated sign in
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return this.signUp('Guest Creator', email, password);
  },

  async signInWithGoogle(): Promise<User> {
    return this.signUp('Google User', 'google@aura.flow', 'none');
  },

  async signOut() {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser(): User | null {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  onAuthChange(callback: (user: User | null) => void) {
    // Emit initial state
    const user = this.getCurrentUser();
    setTimeout(() => callback(user), 0);
    
    // Listen for storage changes if multiple tabs are open
    const listener = () => callback(this.getCurrentUser());
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }
};
