// src/api/types/top.ts
import type { LastFMArtist, LastFMImage } from "./common";

export type TimePeriod =
  | "overall"
  | "7day"
  | "1month"
  | "3month"
  | "6month"
  | "12month";

export interface LastFMTopArtist {
  name: string;
  playcount: string;
  mbid?: string;
  url: string;
  image: LastFMImage[];
}

export interface LastFMTopArtists {
  artist: LastFMTopArtist[];
  "@attr": {
    user: string;
    page: string;
    perPage: string;
    totalPages: string;
    total: string;
  };
}

export interface LastFMTopTrack {
  name: string;
  mbid?: string;
  artist: LastFMArtist;
  url: string;
  playcount: string;
  image: LastFMImage[];
  "@attr"?: {
    rank: string;
  };
}

export interface LastFMTopTracks {
  track: LastFMTopTrack[];
  "@attr": {
    user: string;
    page: string;
    perPage: string;
    totalPages: string;
    total: string;
  };
}

export interface LastFMTopAlbum {
  name: string;
  playcount: string;
  mbid?: string;
  url: string;
  artist: { name: string; mbid?: string; url: string };
  image: LastFMImage[];
}

export interface LastFMTopAlbums {
  album: LastFMTopAlbum[];
  "@attr": {
    user: string;
    page: string;
    perPage: string;
    totalPages: string;
    total: string;
  };
}
