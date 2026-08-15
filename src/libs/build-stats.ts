import LastFMClient from "@/api";
import type { TimePeriod } from "@/api/types/top";

const PERIOD_LABELS: Record<string, string> = {
  "7day": "last 7 days",
  "1month": "last month",
  "12month": "last year",
  overall: "all time",
};

export async function buildStats(
  username: string,
  period: TimePeriod,
  limit: number,
) {
  const [profile, artists, tracks, albums] = await Promise.all([
    LastFMClient.user.getInfo(username),
    LastFMClient.user.getTopArtists(username, period, limit),
    LastFMClient.user.getTopTracks(username, period, limit),
    LastFMClient.user.getTopAlbums(username, period, limit),
  ]);

  const overallPlayCount = Number(profile.playcount || 0);
  const topTrackPlays = tracks.reduce(
    (total, track) => total + Number(track.playcount || 0),
    0,
  );

  const profileExtra = profile as {
    artist_count?: string;
    track_count?: string;
    album_count?: string;
    registered?: { unixtime?: string };
  };
  const registeredUnix = Number(profileExtra.registered?.unixtime || 0);
  const topArtistPlayCount = Number(artists[0]?.playcount || 0);
  const topArtistShare =
    overallPlayCount > 0 ? topArtistPlayCount / overallPlayCount : 0;

  return {
    user: username,
    period,
    periodLabel: PERIOD_LABELS[period] ?? period,
    overallPlayCount,
    topTrackPlayCount: topTrackPlays,
    topArtistShare,
    library: {
      uniqueArtists: Number(profileExtra.artist_count || 0),
      uniqueTracks: Number(profileExtra.track_count || 0),
      uniqueAlbums: Number(profileExtra.album_count || 0),
      memberSince: registeredUnix
        ? new Date(registeredUnix * 1_000).toISOString().slice(0, 10)
        : undefined,
    },
    topArtists: artists.map((artist, index) => ({
      rank: index + 1,
      name: artist.name,
      playCount: artist.playcount,
    })),
    topTracks: tracks.map((track, index) => ({
      rank: index + 1,
      name: track.name,
      artist: track.artist.name,
      playCount: track.playcount,
    })),
    topAlbums: albums.map((album, index) => ({
      rank: index + 1,
      name: album.name,
      artist: album.artist.name,
      playCount: album.playcount,
    })),
  };
}
