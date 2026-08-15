import type { LastFM } from "../client";
import { request } from "../request";
import { enrichImages } from "../enrich";

import type { LastFMArtistInfo } from "../types/artist";

export class ArtistMethods {
  constructor(private readonly client: LastFM) {}

  async getInfo(artist: string, username?: string) {
    const response = await request<{
      artist: LastFMArtistInfo;
    }>(this.client, "artist.getInfo", {
      artist,
      ...(username
        ? {
            username,
          }
        : {}),
    });

    await enrichImages("artist.getInfo", [response.artist]);
    return response.artist;
  }
}
