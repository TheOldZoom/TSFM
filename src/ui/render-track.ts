import type { LastFMImage } from "@/api/types/common";
import { formatWithCommas } from "@/libs/numbers";
import { logger } from "@/libs/logger";
import {
  bestImageUrl,
  renderNativeImage,
  renderAnsiLines,
  renderSideBySide,
  supportsNativeImages,
} from "./image";
import type { Theme } from "./theme";

const MIN_IMAGE_WIDTH = 4;
const DEFAULT_IMAGE_MAX_WIDTH = 40;
const INFO_COLUMN_WIDTH = 36;
const VERTICAL_MARGIN = 8;

export type ImageSize = "compact" | "normal" | "large";

export interface RenderableTrack {
  name: string;
  artist: string;
  album?: string;
  image?: LastFMImage[];
  playCount?: string;
  userPlayCount?: string;
}

function muted(theme: Theme, text: string): string {
  if (theme.enabled) {
    return `\x1b[38;2;100;100;100m${text}\x1b[0m`;
  }
  return text;
}

function buildInfoLines(
  track: RenderableTrack,
  title: string,
  theme: Theme,
): string[] {
  const lines = [theme.bold(title)];

  if (track.artist) {
    lines.push(muted(theme, track.artist));
  }

  const playCount = track.playCount ?? track.userPlayCount;
  if (playCount) {
    const formatted = formatWithCommas(playCount);
    lines.push(`${theme.accent(formatted)} ${theme.dim("plays")}`);
  }

  if (track.album) {
    lines.push("", theme.dim(track.album));
  }

  return lines;
}

export function shouldRenderImages(options: {
  quiet: boolean;
  color: boolean;
  images: boolean;
}): boolean {
  return options.images && !options.quiet && options.color;
}

export function getImageWidth(options: {
  imageSize?: ImageSize;
  imageWidth?: number;
  imageMaxWidth?: number;
} = {}): number {
  const columns = process.stdout.columns;
  const rows = process.stdout.rows;
  const maxWidth = options.imageMaxWidth ?? DEFAULT_IMAGE_MAX_WIDTH;
  const sizeScale =
    options.imageSize === "compact"
      ? 0.21
      : options.imageSize === "large"
        ? 0.33
        : 0.27;

  if (!columns || !rows) {
    return Math.min(options.imageWidth ?? 12, maxWidth);
  }

  const widthFromColumns = Math.floor(columns * sizeScale);
  const widthForDetails = columns - INFO_COLUMN_WIDTH;
  const widthFromRows = Math.floor((rows - VERTICAL_MARGIN) * 2);

  return Math.max(
    MIN_IMAGE_WIDTH,
    Math.min(
      maxWidth,
      options.imageWidth ?? widthFromColumns,
      widthForDetails,
      widthFromRows,
    ),
  );
}

export async function renderTrackLines(
  track: RenderableTrack,
  title: string,
  theme: Theme,
  options: {
    images: boolean;
    nativeImages?: boolean;
    imageSize?: ImageSize;
    imageWidth?: number;
    imageMaxWidth?: number;
    imageSpacing?: number;
  },
): Promise<string[]> {
  const infoLines = buildInfoLines(track, title, theme);
  const imageWidth = getImageWidth(options);

  if (!options.images) {
    return infoLines;
  }

  const imageUrl = bestImageUrl(track.image);
  if (!imageUrl) {
    logger.debug("Rendering track without image", { track: track.name });
    return infoLines;
  }

  if (options.nativeImages && supportsNativeImages()) {
    try {
      return [await renderNativeImage(imageUrl, imageWidth), "", ...infoLines];
    } catch (err) {
      logger.debug("Native image render failed; falling back to ANSI", {
        track: track.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    const imageLines = await renderAnsiLines(imageUrl, imageWidth);
    return renderSideBySide(
      imageLines,
      infoLines,
      imageWidth,
      options.imageSpacing,
    );
  } catch (err) {
    logger.debug("Track image render failed", {
      track: track.name,
      error: err instanceof Error ? err.message : String(err),
    });
    return infoLines;
  }
}

export function shouldUseNativeImages(options: {
  quiet: boolean;
  color: boolean;
  images: boolean;
  imageMode: "auto" | "ansi";
}): boolean {
  return shouldRenderImages(options) && options.imageMode === "auto";
}

export function printLines(lines: string[]): void {
  for (const line of lines) {
    console.log(line);
  }
}
