export interface YoutubeAuthor {
  name: string;
  channelID: string;
  url: string;
}

export interface YoutubeVideoItem {
  type: 'video';
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  isLive: boolean;
  duration: string;
  author: YoutubeAuthor | null;
}

export interface YoutubeSearchResult {
  query: string;
  items: YoutubeVideoItem[];
  results: number;
}
