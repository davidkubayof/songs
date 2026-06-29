import type { MusicService } from '@/services/MusicService';

let youtubeInstance: MusicService | null = null;

export async function getMusicService(): Promise<MusicService> {
  if (!youtubeInstance) {
    const mod = await import('@/services/YoutubeService');
    youtubeInstance = mod.youtubeService;
  }
  return youtubeInstance;
}
