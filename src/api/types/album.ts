import type { LastFMImage } from "./common";

export interface LastFMAlbumInfo {
  name: string;
  artist: string;
  url: string;

  userplaycount?: string;
  playcount?: string;

  image: LastFMImage[];
}
