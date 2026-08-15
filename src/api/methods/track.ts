import type { LastFM } from "../client";
import { request } from "../request";
import { enrichImages } from "../enrich";

import type { LastFMTrackInfo } from "../types/track";

export class TrackMethods {
  constructor(private readonly client: LastFM) {}

  async getInfo(options: { artist: string; track: string; username?: string }) {
    const response = await request<{
      track: LastFMTrackInfo;
    }>(this.client, "track.getInfo", {
      artist: options.artist,
      track: options.track,
      ...(options.username
        ? {
            username: options.username,
          }
        : {}),
    });

    await enrichImages("track.getInfo", [response.track]);
    return response.track;
  }
}
