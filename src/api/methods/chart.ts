// api/methods/chart.ts
import type { LastFM } from "../client";
import { request } from "../request";

import type { LastFMArtist } from "../types/common";
import type { LastFMTrack } from "../types/track";

export class ChartMethods {
  constructor(private readonly client: LastFM) {}

  async getTopArtists(limit = 50) {
    const response = await request<{
      artists: { artist: LastFMArtist[] };
    }>(this.client, "chart.getTopArtists", { limit });

    return response.artists.artist;
  }

  async getTopTracks(limit = 50) {
    const response = await request<{
      tracks: { track: LastFMTrack[] };
    }>(this.client, "chart.getTopTracks", { limit });

    return response.tracks.track;
  }
}
