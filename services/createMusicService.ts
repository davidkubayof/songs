import { mockMusicService } from '@/services/MockMusicService';
import type { MusicService } from '@/services/MusicService';

let youtubeInstance: MusicService | null = null;

function useMock(): boolean {
  const flag = process.env.USE_MOCK_MUSIC?.trim().toLowerCase();
  if (!flag) return true;
  return flag === 'true' || flag === '1' || flag === 'yes';
}

export async function getMusicService(): Promise<MusicService> {
  if (useMock()) return mockMusicService;
  if (!youtubeInstance) {
    const mod = await import('@/services/YoutubeService');
    youtubeInstance = mod.youtubeService;
  }
  return youtubeInstance;
}
