import type { YoutubeVideoItem } from '@/types/YoutubeRaw';

export const MOCK_RAW_TRACKS: YoutubeVideoItem[] = [
  {
    type: 'video',
    id: 'mock-1',
    name: 'Midnight Drive',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: '/icons/icon.svg',
    isLive: false,
    duration: '3:34',
    author: { name: 'Neon Waves', channelID: 'c1', url: '' },
  },
  {
    type: 'video',
    id: 'mock-2',
    name: 'Ocean Breeze',
    url: 'https://www.youtube.com/watch?v=ktvTqknDobU',
    thumbnail: '/icons/icon.svg',
    isLive: false,
    duration: '3:07',
    author: { name: 'Coastal Echo', channelID: 'c2', url: '' },
  },
  {
    type: 'video',
    id: 'mock-3',
    name: 'Lofi Study Beats',
    url: 'https://www.youtube.com/watch?v=RgKAFK5djSk',
    thumbnail: '/icons/icon.svg',
    isLive: false,
    duration: '4:05',
    author: { name: 'Chill Collective', channelID: 'c3', url: '' },
  },
  {
    type: 'video',
    id: 'mock-4',
    name: 'Golden Hour',
    url: 'https://www.youtube.com/watch?v=RgKAFK5djSk',
    thumbnail: '/icons/icon.svg',
    isLive: false,
    duration: '4:05',
    author: { name: 'Sunset Collective', channelID: 'c4', url: '' },
  },
];
