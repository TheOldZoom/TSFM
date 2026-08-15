import sharp from "sharp";
import { logger } from "@/libs/logger";

type Rgb = [number, number, number];

const LASTFM_PLACEHOLDER_IMAGE_ID = "2a96cbd8b46e442fc41c2b86b821562f";

export function isPlaceholderImageUrl(url: string): boolean {
  return url.includes(LASTFM_PLACEHOLDER_IMAGE_ID);
}

export function bestImageUrl(
  images: { "#text": string; size: string }[] | undefined,
): string {
  if (!images?.length) return "";

  for (let i = images.length - 1; i >= 0; i--) {
    const url = images[i]?.["#text"];
    if (url && !isPlaceholderImageUrl(url)) {
      return url;
    }
  }

  return "";
}

interface RawImage {
  data: Uint8Array;
  width: number;
  height: number;
  channels: number;
}

async function loadImage(source: string): Promise<RawImage> {
  logger.debug("Loading image", { source });

  const response = await fetch(source, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const { data, info } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  };
}

async function fetchImage(source: string): Promise<Buffer> {
  logger.debug("Loading native terminal image", { source });

  const response = await fetch(source, {
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

type NativeImageProtocol = "iterm" | "kitty";

function nativeImageProtocol(): NativeImageProtocol | undefined {
  const termProgram = process.env.TERM_PROGRAM?.toLowerCase();
  const term = process.env.TERM?.toLowerCase();

  if (termProgram === "iterm.app" || termProgram === "wezterm") {
    return "iterm";
  }

  if (
    process.env.KITTY_WINDOW_ID ||
    term === "xterm-kitty" ||
    termProgram === "ghostty"
  ) {
    return "kitty";
  }

  return undefined;
}

export function supportsNativeImages(): boolean {
  return nativeImageProtocol() !== undefined;
}

export async function renderNativeImage(
  source: string,
  width: number,
): Promise<string> {
  const protocol = nativeImageProtocol();
  if (!protocol) {
    throw new Error("Native terminal images are not supported");
  }

  const image = await fetchImage(source);

  if (protocol === "iterm") {
    return `\x1b]1337;File=inline=1;width=${width};height=auto;preserveAspectRatio=1:${image.toString("base64")}\x07`;
  }

  return renderKittyImage(await sharp(image).png().toBuffer(), width);
}

function renderKittyImage(image: Buffer, width: number): string {
  const payload = image.toString("base64");
  const chunkSize = 4096;
  const chunks: string[] = [];

  for (let index = 0; index < payload.length; index += chunkSize) {
    const chunk = payload.slice(index, index + chunkSize);
    const more = index + chunkSize < payload.length ? 1 : 0;
    const control =
      index === 0 ? `a=T,f=100,t=d,c=${width},m=${more}` : `m=${more}`;
    chunks.push(`\x1b_G${control};${chunk}\x1b\\`);
  }

  return chunks.join("");
}

function sample(
  image: RawImage,
  x: number,
  y: number,
  dstW: number,
  dstH: number,
): Rgb {
  const srcX = Math.min(image.width - 1, Math.floor((x * image.width) / dstW));
  const srcY = Math.min(
    image.height - 1,
    Math.floor((y * image.height) / dstH),
  );
  const i = (srcY * image.width + srcX) * image.channels;
  return [image.data[i]!, image.data[i + 1]!, image.data[i + 2]!];
}

export async function renderAnsiLines(
  source: string,
  width: number,
): Promise<string[]> {
  const image = await loadImage(source);
  if (image.width === 0 || image.height === 0) {
    throw new Error("Image has no size");
  }

  const height = Math.max(
    1,
    Math.round(((image.height * width) / image.width) * 0.5),
  );
  const lines: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = "";
    for (let x = 0; x < width; x++) {
      const [tr, tg, tb] = sample(image, x, y * 2, width, height * 2);
      const [br, bg, bb] = sample(image, x, y * 2 + 1, width, height * 2);
      line += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀`;
    }
    line += "\x1b[0m";
    lines.push(line);
  }

  return lines;
}

export function renderSideBySide(
  leftLines: string[],
  rightLines: string[],
  leftWidth: number,
  gap = 2,
): string[] {
  const leftStart = 0;
  const rightStart = 1;
  let rows = leftStart + leftLines.length;
  if (rightStart + rightLines.length > rows) {
    rows = rightStart + rightLines.length;
  }

  const output: string[] = [];

  for (let i = 0; i < rows; i++) {
    let left = " ".repeat(leftWidth);
    if (i >= leftStart && i < leftStart + leftLines.length) {
      left = leftLines[i - leftStart]!;
    }

    let right = "";
    if (i >= rightStart && i < rightStart + rightLines.length) {
      right = rightLines[i - rightStart]!;
    }

    output.push(`${left}${" ".repeat(gap)}${right}`);
  }

  return output;
}
