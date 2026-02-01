
export enum AppTab {
  HOME = 'home',
  EXPLORE = 'explore',
  UPLOAD = 'upload',
  SAVED = 'saved',
  PROFILE = 'profile'
}

export type AspectRatio = '9:16' | '16:9' | '4:3' | '1:1';

export interface Wallpaper {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  url: string;
  views: string;
  downloads: string;
  likes: string;
  type: 'live' | 'parallax' | 'interactive' | 'static';
  tags: string[];
  aspectRatio?: AspectRatio;
  deviceTarget?: 'phone' | 'pc' | 'tab' | 'all';
}

export interface Collection {
  id: string;
  name: string;
  author: string;
  itemCount: number;
  previewImages: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers: string;
  following: string;
  uploads: number;
  isElite?: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'remix' | 'milestone';
  user?: { name: string; avatar: string };
  wallpaperTitle?: string;
  time: string;
  read: boolean;
  content?: string;
  previewUrl?: string;
}
