import type { LastFMImage } from "./common";

export interface LastFMUser {
  name: string;
  realname: string;

  url: string;

  country?: string;
  age?: string;
  gender?: string;

  subscriber: string;

  playcount: string;
  playlists: string;
  bootstrap: string;

  registered: {
    unixtime: string;
    "#text": string;
  };

  image: LastFMImage[];
}
