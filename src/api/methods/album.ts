import type { LastFM } from "../client";
import { request } from "../request";
import { enrichImages } from "../enrich";

import type { LastFMAlbumInfo } from "../types/album";

export class AlbumMethods {
  constructor(private readonly client: LastFM) {}

  async getInfo(options: { artist: string; album: string; username?: string }) {
    const response = await request<{
      album: LastFMAlbumInfo;
    }>(this.client, "album.getInfo", {
      artist: options.artist,
      album: options.album,

      ...(options.username
        ? {
            username: options.username,
          }
        : {}),
    });

    await enrichImages("album.getInfo", [response.album]);
    return response.album;
  }
}
