import Dexie, { type Table } from 'dexie';

import type { Track } from '@/types/Music';

interface GuestTrackRow {
  id: string;
  track: Track;
}

export class SongsDexie extends Dexie {
  tracks!: Table<GuestTrackRow, string>;

  constructor() {
    super('SongsDB');
    this.version(1).stores({ tracks: 'id' });
  }
}

export const songsDb = new SongsDexie();
