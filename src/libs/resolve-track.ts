import LastFMClient from "@/api";
import { UsageError } from "@/libs/errors";

export interface ResolvedTrack {
  artist: string;
  track: string;
  album?: string;
  source: "explicit" | "now-playing" | "recent";
}

export async function resolveTrack(
  username: string,
  explicit: { artist?: string; track?: string; album?: string },
): Promise<ResolvedTrack> {
  if (explicit.artist && explicit.track) {
    return {
      artist: explicit.artist,
      track: explicit.track,
      album: explicit.album,
      source: "explicit",
    };
  }

  const recent = await LastFMClient.user.getRecentTracks(username, 1);
  const candidate = recent.track[0];

  if (!candidate) {
    throw new UsageError(
      "No artist/track given, and no currently playing or recent track was found.",
    );
  }

  const nowPlaying = candidate["@attr"]?.nowplaying === "true";

  return {
    artist: explicit.artist ?? candidate.artist["#text"],
    track: explicit.track ?? candidate.name,
    album: (explicit.album ?? candidate.album?.["#text"]) || undefined,
    source: nowPlaying ? "now-playing" : "recent",
  };
}

export function sourceLabel(source: ResolvedTrack["source"]): string {
  if (source === "now-playing") return " (now playing)";
  if (source === "recent") return " (last played)";
  return "";
}
