export interface Track {
  title: string;
  artist: string;
  src: string;
  cover?: string; // optional album art, e.g. '/music/covers/xxx.jpg'
}

// Edit this list to update "now playing". Files live in public/music/...
export const tracks: Track[] = [
  {
    artist: 'Billie Holiday',
    title:  'Solitude',
    src:    '/music/Billie Holiday - Solitude.mp3',
    cover:  '/music/covers/Billie Holiday - Solitude.jpg',
  },
  {
    artist: 'Chanpan, Ladji Mouflet',
    title:  'Jungle',
    src:    '/music/Chanpan, Ladji Mouflet - jungle.mp3',
    cover:  '/music/covers/Chanpan, Ladji Mouflet - jungle.jpg',
  },
  {
    artist: 'Dari',
    title:  'GBB26 Wildcard',
    src:    '/music/Dari  - GBB26Wildcard.mp3',
    cover:  '/music/covers/Dari  - GBB26Wildcard.jpeg',
  },
  {
    artist: 'Mochakk',
    title:  'Express Yourself (Remix)',
    src:    '/music/Express Yourself - Mochakk Remix.mp3',
    cover:  '/music/covers/Express Yourself - Mochakk Remix.jpg',
  },
  {
    artist: 'Mahiro',
    title:  'REMNANT',
    src:    '/music/Mahiro - REMNANT.mp3',
    cover:  '/music/covers/Mahiro - REMNANT.jpg',
  },
  {
    artist: 'MYTHM',
    title:  'Grim',
    src:    '/music/MYTHM - Grim.mp3',
    cover:  '/music/covers/MYTHM - Grim.jpg',
  },
  {
    artist: 'Pete Rock, InI',
    title:  'Grown Man Sport',
    src:    '/music/Pete Rock, InI - Grown Man Sport.mp3',
    cover:  '/music/covers/Pete Rock, InI - Grown Man Sport.jpg',
  },
];
