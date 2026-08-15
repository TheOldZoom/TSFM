import type { LastFM } from "../client";
import { request } from "../request";

import type { LastFMUser } from "../types/user";

import type { LastFMRecentTracks } from "../types/track";

export class UserMethods {
  constructor(private readonly client: LastFM) {}

  async getInfo(user: string) {
    const response = await request<{
      user: LastFMUser;
    }>(this.client, "user.getInfo", {
      user,
    });

    return response.user;
  }

  async getRecentTracks(user: string) {
    const response = await request<{
      recenttracks: LastFMRecentTracks;
    }>(this.client, "user.getRecentTracks", {
      user,
    });

    return response.recenttracks;
  }
}
