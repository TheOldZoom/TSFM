import type { LastFM } from "../client";
import { request } from "../request";
import { enrichImages } from "../enrich";

import type { LastFMUser } from "../types/user";
import type { LastFMRecentTracks } from "../types/track";
import type {
  LastFMTopArtists,
  LastFMTopTracks,
  LastFMTopAlbums,
  TimePeriod,
} from "../types/top";

export class UserMethods {
  constructor(private readonly client: LastFM) {}

  async getInfo(user: string) {
    const response = await request<{ user: LastFMUser }>(
      this.client,
      "user.getInfo",
      { user },
    );
    await enrichImages("user.getInfo", [response.user]);
    return response.user;
  }

  async getRecentTracks(
    user: string,
    limit = 10,
    options: { from?: number; to?: number; page?: number } = {},
  ) {
    const response = await request<{ recenttracks: LastFMRecentTracks }>(
      this.client,
      "user.getRecentTracks",
      {
        user,
        limit,
        ...(options.from ? { from: options.from } : {}),
        ...(options.to ? { to: options.to } : {}),
        ...(options.page ? { page: options.page } : {}),
      },
    );
    await enrichImages("user.getRecentTracks", response.recenttracks.track);
    return response.recenttracks;
  }

  async getTopArtists(
    user: string,
    period: TimePeriod = "overall",
    limit = 10,
  ) {
    const response = await request<{ topartists: LastFMTopArtists }>(
      this.client,
      "user.getTopArtists",
      { user, period, limit },
    );
    await enrichImages("user.getTopArtists", response.topartists.artist);
    return response.topartists.artist;
  }

  async getTopTracks(user: string, period: TimePeriod = "overall", limit = 10) {
    const response = await request<{ toptracks: LastFMTopTracks }>(
      this.client,
      "user.getTopTracks",
      { user, period, limit },
    );
    await enrichImages("user.getTopTracks", response.toptracks.track);
    return response.toptracks.track;
  }

  async getTopAlbums(user: string, period: TimePeriod = "overall", limit = 10) {
    const response = await request<{ topalbums: LastFMTopAlbums }>(
      this.client,
      "user.getTopAlbums",
      { user, period, limit },
    );
    await enrichImages("user.getTopAlbums", response.topalbums.album);
    return response.topalbums.album;
  }
}
