import { mockMusicService } from '@/services/MockMusicService';
import type { MusicService } from '@/services/MusicService';

let youtubeInstance: MusicService | null = null;

export async function getMusicService(): Promise<MusicService> {
  if (process.env.USE_MOCK_MUSIC === 'true') {
    return mockMusicService;
  }
  if (!youtubeInstance) {
    const mod = await import('@/services/YoutubeService');
    youtubeInstance = mod.youtubeService;
  }
  return youtubeInstance;
}
