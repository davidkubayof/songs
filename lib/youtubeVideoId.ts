const VIDEO_ID = /^[\w-]{11}$/;

export function isValidVideoId(videoId: string): boolean {
  return VIDEO_ID.test(videoId);
}
