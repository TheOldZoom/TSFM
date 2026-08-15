import { logger } from "@/libs/logger";
import type { LastFM } from "./client";
import { LastFMApiError } from "./errors";

interface LastFMErrorResponse {
  error: number;
  message: string;
}

interface RequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

export async function request<T>(
  client: LastFM,
  method: string,
  params: Record<string, string | number>,
  options: RequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const maxRetries = options.maxRetries ?? 2;

  const searchParams = new URLSearchParams({
    method,
    api_key: client.apiKey,
    format: "json",
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
  });

  const url = `${client.baseUrl}?${searchParams}`;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      logger.debug("Last.fm request", {
        method,
        url,
        attempt,
        params: Object.fromEntries(searchParams.entries()),
        headers: { "User-Agent": client.userAgent },
      });

      const response = await fetch(url, {
        headers: { "User-Agent": client.userAgent },
        signal: controller.signal,
      });

      const body = await response.text();

      logger.debug("Last.fm response", {
        method,
        status: response.status,
        statusText: response.statusText,
        body,
      });

      if (!response.ok) {
        logger.error("Last.fm request failed", {
          method,
          status: response.status,
          body,
        });
        throw new Error(`Last.fm request failed (${response.status}): ${body}`);
      }

      const data: unknown = JSON.parse(body);

      if (isLastFMError(data)) {
        logger.error("Last.fm API error", {
          method,
          code: data.error,
          message: data.message,
        });
        throw new LastFMApiError(data.message, data.error);
      }
      logger.debug("Last.fm request completed", { method, attempt });

      return data as T;
    } catch (err) {
      lastError = err;

      if (err instanceof LastFMApiError) {
        throw err;
      }

      const isTimeout =
        err instanceof DOMException && err.name === "AbortError";
      if (isTimeout) {
        logger.warn("Last.fm request timed out", { method, attempt });
      }
      if (attempt < maxRetries) {
        const backoff = 300 * 2 ** attempt;
        logger.debug("Retrying Last.fm request", { method, attempt, backoff });
        await sleep(backoff);
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isLastFMError(data: unknown): data is LastFMErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    "message" in data
  );
}
