
import { Wallpaper, Collection, User, Notification } from './types';

export const CATEGORY_ASSETS: Record<string, string> = {
  'All': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
  'Marvel': 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=80&w=400',
  'Anime': 'https://images.unsplash.com/photo-1578632738980-230555000275?auto=format&fit=crop&q=80&w=400',
  'Gaming': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400',
  'DC': 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&q=80&w=400',
  'Space': 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=400',
  'Minimal': 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=400',
  'Cinema': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=400',
  'Live': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400'
};

const POP_CULTURE_DATA = [
  { category: 'Anime', titles: ['Zenith Gojo', 'Neon Tokyo', 'Ghibli Hills', 'Soul Reaper', 'Uchiha Night', 'Strawhat Sunset', 'Titan Fall', 'Eva Unit-01'], tags: ['Jujutsu', 'Akira', 'Ghibli', 'Bleach', 'Naruto', 'One Piece', 'AOT', 'Evangelion', 'Jujutsu Kaisen', 'Goku', 'Dragon Ball'] },
  { category: 'Marvel', titles: ['Spidey Verse', 'Iron Legacy', 'Wanda Chaos', 'Thor Storm', 'God of Mischief', 'Wakanda Forever'], tags: ['Spider-man', 'Spiderman', 'Avengers', 'MCU', 'Multiverse', 'Iron Man', 'Peter Parker', 'Venom'] },
  { category: 'DC', titles: ['Dark Knight', 'Man of Steel', 'Arkham Fog', 'Amazonian Gold', 'Joker Smile', 'Speed Force'], tags: ['Batman', 'Superman', 'Gotham', 'Justice League', 'The Joker', 'Wonder Woman', 'Flash'] },
  { category: 'Cinema', titles: ['Arrakis Sands', 'Interstellar Void', 'Neo Seoul', 'Tatooine Moons', 'Matrix Rain'], tags: ['Dune', 'Nolan', 'Blade Runner', 'Star Wars', 'Sci-Fi', 'Avatar'] },
  { category: 'Gaming', titles: ['Elden Ring', 'Cyberpunk 2077', 'God of War', 'Halo Reach', 'Zelda Wild'], tags: ['Gaming', 'Playstation', 'Xbox', 'Nintendo', 'Cyberpunk', 'Kratos', 'Master Chief'] },
  { category: 'Space', titles: ['Nebula Core', 'Andromeda Edge', 'Event Horizon', 'Cosmic Dust'], tags: ['Space', 'Galaxy', 'Astronomy', 'Stars', 'Universe', 'NASA'] },
  { category: 'Minimal', titles: ['Void Aura', 'Peach Pastel', 'Arctic Ice', 'Slate Line'], tags: ['Clean', 'Aesthetic', 'Modern', 'Minimal'] }
];

const AUTHORS = [
  { name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?u=alex' },
  { name: 'Otaku Visuals', avatar: 'https://i.pravatar.cc/150?u=otaku' },
  { name: 'Marvelous Art', avatar: 'https://i.pravatar.cc/150?u=marvel' },
  { name: 'Gotham Designer', avatar: 'https://i.pravatar.cc/150?u=gotham' },
  { name: 'Cyber Spirit', avatar: 'https://i.pravatar.cc/150?u=cyber' }
];

const generateWallpapers = (count: number): Wallpaper[] => {
  return Array.from({ length: count }).map((_, i) => {
    const popData = POP_CULTURE_DATA[i % POP_CULTURE_DATA.length];
    const title = popData.titles[i % popData.titles.length];
    const author = AUTHORS[i % AUTHORS.length];
    const id = (i + 1).toString();
    const type = i % 3 === 0 ? 'live' : i % 3 === 1 ? 'parallax' : 'static';
    
    return {
      id,
      title: `${title} #${Math.floor(i/5) + 1}`,
      author: author.name,
      authorAvatar: author.avatar,
      url: `https://picsum.photos/seed/${(i + 1) * 13}/1000/1800`,
      views: `${(Math.random() * 80 + 10).toFixed(1)}k`,
      downloads: `${(Math.random() * 20 + 2).toFixed(1)}k`,
      likes: Math.floor(Math.random() * 10000).toString(),
      type: type as any,
      tags: [...popData.tags, popData.category, 'Premium', '4K']
    };
  });
};

export const MOCK_WALLPAPERS: Wallpaper[] = generateWallpapers(160);

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'c-anime',
    name: 'Shonen Elite',
    author: '@OtakuVisuals',
    itemCount: 42,
    previewImages: [
      'https://picsum.photos/seed/anime1/400/400',
      'https://picsum.photos/seed/anime2/200/200',
      'https://picsum.photos/seed/anime3/200/200'
    ]
  },
  {
    id: 'c-marvel',
    name: 'Multiverse HQ',
    author: '@MarvelousArt',
    itemCount: 28,
    previewImages: [
      'https://picsum.photos/seed/marvel1/400/400',
      'https://picsum.photos/seed/marvel2/200/200',
      'https://picsum.photos/seed/marvel3/200/200'
    ]
  },
  {
    id: 'c-cinema',
    name: 'Nolan Vision',
    author: '@AlexRivera',
    itemCount: 15,
    previewImages: [
      'https://picsum.photos/seed/cinema1/400/400',
      'https://picsum.photos/seed/cinema2/200/200',
      'https://picsum.photos/seed/cinema3/200/200'
    ]
  },
  {
    id: 'c-dc',
    name: 'Gotham Depths',
    author: '@GothamDesigner',
    itemCount: 33,
    previewImages: [
      'https://picsum.photos/seed/dc1/400/400',
      'https://picsum.photos/seed/dc2/200/200',
      'https://picsum.photos/seed/dc3/200/200'
    ]
  }
];

export const DEFAULT_USER: User = {
  id: 'u1',
  name: 'Alex Rivera',
  username: 'arivera_pixels',
  avatar: 'https://i.pravatar.cc/150?u=alex',
  bio: 'Capturing light and pixels. Creating high-end minimalist and pop-culture wallpapers.',
  followers: '12.5k',
  following: '842',
  uploads: 156,
  isElite: true
};

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'remix',
    user: { name: 'Neo_Art', avatar: 'https://i.pravatar.cc/150?u=neo' },
    wallpaperTitle: 'Spider-Verse Noir',
    content: 'Love the glitch effect, used it for my home screen!',
    time: 'just now',
    read: false,
    previewUrl: 'https://picsum.photos/seed/remix/400/200'
  }
];
