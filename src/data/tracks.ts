export interface Track {
  title: string;
  artist: string;
  genre: string;
  src: string;
  cover?: string; // optional album art, e.g. '/music/covers/xxx.jpg'
}

// Edit this list to update "now playing". Files live in public/music/...
export const tracks: Track[] = [
  { artist: 'Colaps',          title: 'Moments Away',     genre: 'DnB', src: '/music/dnb/Colaps - Moments Away.mp3' },
  { artist: 'Raje',            title: 'YAMA',             genre: 'DnB', src: '/music/dnb/Raje - YAMA.mp3' },
  { artist: 'KBA, Mr. Esuoh',  title: 'Dimension (VIP)',  genre: 'DnB', src: '/music/dnb/KBA, Mr. Esuoh - Dimension (VIP).mp3' },
  { artist: '808Banon',        title: 'Stone Cold',       genre: 'DnB', src: '/music/dnb/808Banon - Stone cold.mp3' },
  { artist: 'KBA',             title: 'Soon Again',       genre: 'DnB', src: '/music/dnb/KBA - Soon Again.mp3' },
  { artist: 'LFO',             title: 'POWER',            genre: 'DnB', src: '/music/dnb/LFO - POWER.mp3' },
  { artist: 'ZhangZe',         title: 'G Fish Tofu',      genre: 'DnB', src: '/music/dnb/ZhangZe - G fish Tofu.mp3' },
];
