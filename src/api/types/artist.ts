import type { LastFMImage } from "./common";

export interface LastFMArtistInfo {
  name: string;
  url: string;

  stats: {
    listeners: string;
    playcount: string;

    userplaycount?: string;
    userloved?: string;
  };

  image: LastFMImage[];
}
