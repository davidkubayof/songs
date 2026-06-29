import type { YoutubeVideoItem } from '@/types/YoutubeRaw';

interface ApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { high?: { url: string }; medium?: { url: string } };
  };
}

interface ApiResponse {
  items?: ApiItem[];
}

export async function searchYoutubeApi(query: string): Promise<YoutubeVideoItem[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return [];

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', '20');
  url.searchParams.set('q', query);
  url.searchParams.set('key', key);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = (await res.json()) as ApiResponse;
  return (data.items ?? []).map((item) => ({
    type: 'video' as const,
    id: item.id.videoId,
    name: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    thumbnail:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      '',
    isLive: false,
    duration: '0:00',
    author: {
      name: item.snippet.channelTitle,
      channelID: '',
      url: '',
    },
  }));
}
