import type { LastFM } from "../client";
import { request } from "../request";
import { enrichImages } from "../enrich";

import type { LastFMTopArtist } from "../types/top";
import type { LastFMTrack } from "../types/track";

export class ChartMethods {
  constructor(private readonly client: LastFM) {}

  async getTopArtists(limit = 50) {
    const response = await request<{
      artists: { artist: LastFMTopArtist[] };
    }>(this.client, "chart.getTopArtists", { limit });

    await enrichImages("chart.getTopArtists", response.artists.artist);
    return response.artists.artist;
  }

  async getTopTracks(limit = 50) {
    const response = await request<{
      tracks: { track: LastFMTrack[] };
    }>(this.client, "chart.getTopTracks", { limit });

    await enrichImages("chart.getTopTracks", response.tracks.track);
    return response.tracks.track;
  }
}
