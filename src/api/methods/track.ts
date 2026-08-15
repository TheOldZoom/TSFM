import type { LastFM } from "../client";
import { request, signedRequest } from "../request";
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
  async love(artist: string, track: string): Promise<void> {
    await signedRequest(this.client, "track.love", { artist, track });
  }

  async unlove(artist: string, track: string): Promise<void> {
    await signedRequest(this.client, "track.unlove", { artist, track });
  }

  async scrobble(options: {
    artist: string;
    track: string;
    album?: string;
    timestamp?: number;
  }): Promise<void> {
    await signedRequest(this.client, "track.scrobble", {
      artist: options.artist,
      track: options.track,
      timestamp: options.timestamp ?? Math.floor(Date.now() / 1000),
      ...(options.album ? { album: options.album } : {}),
    });
  }

  async updateNowPlaying(options: {
    artist: string;
    track: string;
    album?: string;
  }): Promise<void> {
    await signedRequest(this.client, "track.updateNowPlaying", {
      artist: options.artist,
      track: options.track,
      ...(options.album ? { album: options.album } : {}),
    });
  }

  async addTags(options: {
    artist: string;
    track: string;
    tags: string[];
  }): Promise<void> {
    await signedRequest(this.client, "track.addTags", {
      artist: options.artist,
      track: options.track,
      tags: options.tags.slice(0, 10).join(","),
    });
  }

  async removeTag(options: {
    artist: string;
    track: string;
    tag: string;
  }): Promise<void> {
    await signedRequest(this.client, "track.removeTag", {
      artist: options.artist,
      track: options.track,
      tag: options.tag,
    });
  }
}
