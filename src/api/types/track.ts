import type { LastFMArtist, LastFMAlbum, LastFMImage } from "./common";

export interface LastFMTrack {
  name: string;
  mbid?: string;

  artist: LastFMArtist;

  album?: LastFMAlbum;

  url: string;

  image: LastFMImage[];

  date?: {
    uts: string;
    "#text": string;
  };

  "@attr"?: {
    nowplaying: "true";
  };
}

export interface LastFMTrackInfo {
  name: string;
  duration?: string;

  artist: {
    name: string;
    mbid?: string;
    url: string;
  };

  album?: {
    title: string;
    artist: string;
    url: string;
  };

  userplaycount?: string;
  playcount?: string;

  url: string;

  image: LastFMImage[];
}

export interface LastFMRecentTracks {
  track: LastFMTrack[];

  "@attr": {
    user: string;
    total: string;
    page: string;
    perPage: string;
    totalPages: string;
  };
}
