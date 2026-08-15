import LastFMClient from "@/api";
import type { LastFMImage } from "@/api/types/common";
import type { LastFMTrack } from "@/api/types/track";
import { logger } from "@/libs/logger";
import { cacheGet, cacheSet } from "@/cache/store";
import { cacheKey } from "@/cache/keys";
import { ttlFor } from "@/cache/ttl";
import { isCacheEnabled, isOfflineMode } from "@/cache/context";

const LASTFM_PLACEHOLDER_IMAGE_ID = "2a96cbd8b46e442fc41c2b86b821562f";
const MAX_IMAGE_ENRICHMENT_CONCURRENCY = 6;
const IMAGE_CACHE_METHOD = "image.page";

interface ImageEntity {
  name: string;
  url: string;
  image: LastFMImage[];
}

function trackKey(track: LastFMTrack): string {
  return `${track.artist["#text"]}\0${track.name}`;
}

export function hasUsableImage(images: LastFMImage[] | undefined): boolean {
  return Boolean(
    images?.some(
      (image) =>
        image["#text"] && !image["#text"].includes(LASTFM_PLACEHOLDER_IMAGE_ID),
    ),
  );
}

export async function enrichImages<T extends ImageEntity>(
  source: string,
  entities: T[],
): Promise<void> {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(MAX_IMAGE_ENRICHMENT_CONCURRENCY, entities.length) },
    async () => {
      while (nextIndex < entities.length) {
        const entity = entities[nextIndex++];
        if (!entity || hasUsableImage(entity.image)) continue;

        try {
          const imageUrl = await fetchPageImageCached(entity.url);
          if (imageUrl) {
            entity.image = [{ "#text": imageUrl, size: "extralarge" }];
          }
        } catch (err) {
          logger.debug("Last.fm image fallback failed", {
            source,
            name: entity.name,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    },
  );

  await Promise.all(workers);
}

async function fetchPageImageCached(
  pageUrl: string,
): Promise<string | undefined> {
  const key = cacheKey(IMAGE_CACHE_METHOD, { url: pageUrl });

  if (isCacheEnabled()) {
    const cached = cacheGet<string | null>(key);
    if (cached !== undefined) {
      logger.debug("Image cache hit", { url: pageUrl });
      return cached ?? undefined;
    }
  }

  if (isOfflineMode()) {
    return undefined;
  }

  const imageUrl = await fetchPageImage(pageUrl);

  if (isCacheEnabled()) {
    cacheSet(key, imageUrl ?? null, ttlFor(IMAGE_CACHE_METHOD));
  }

  return imageUrl;
}

async function fetchPageImage(url: string): Promise<string | undefined> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "@theoldzoom/TSFM (+https://github.com/TheOldZoom/TSFM)",
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Last.fm page request failed (${response.status})`);
  }

  return extractSocialImage(await response.text());
}

function extractSocialImage(html: string): string | undefined {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const property =
      readHtmlAttribute(tag, "property") ?? readHtmlAttribute(tag, "name");
    if (property?.toLowerCase() !== "og:image") continue;

    const content = readHtmlAttribute(tag, "content");
    if (
      content?.startsWith("https://") &&
      !content.includes(LASTFM_PLACEHOLDER_IMAGE_ID)
    ) {
      return content.replaceAll("&amp;", "&");
    }
  }

  return undefined;
}

function readHtmlAttribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2];
}

export async function enrichTrackUserPlays(
  username: string,
  tracks: LastFMTrack[],
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  await Promise.all(
    tracks.map(async (track) => {
      try {
        const info = await LastFMClient.track.getInfo({
          artist: track.artist["#text"],
          track: track.name,
          username,
        });

        if (info.userplaycount) {
          results.set(trackKey(track), info.userplaycount);
        }
      } catch (err) {
        logger.debug("Failed to enrich track plays", {
          track: track.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );

  return results;
}

export function applyEnrichedPlays(
  track: LastFMTrack,
  plays: Map<string, string>,
): string | undefined {
  return plays.get(trackKey(track));
}
