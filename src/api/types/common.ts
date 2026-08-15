export type LastFMImageSize =
  | "small"
  | "medium"
  | "large"
  | "extralarge"
  | "mega";

export interface LastFMImage {
  "#text": string;
  size: LastFMImageSize;
}

export interface LastFMArtist {
  "#text": string;
  mbid?: string;
}

export interface LastFMAlbum {
  "#text": string;
  mbid?: string;
}
