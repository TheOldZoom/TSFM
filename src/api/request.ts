import { logger } from "@/libs/logger";
import type { LastFM } from "./client";
import { LastFMApiError } from "./errors";
import { isOfflineMode } from "@/cache/context";
import { OfflineError } from "@/libs/errors";
import { createHash } from "node:crypto";
import { AuthError } from "@/libs/errors";

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

  if (isOfflineMode()) {
    throw new OfflineError(
      `"${method}"${
        params.user ? ` (${params.user})` : ""
      } requires network access and can't run in --offline mode.`,
    );
  }

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

export interface SignedRequestOptions {
  timeoutMs?: number;
  sessionKey?: string;
}

function signParams(params: Record<string, string>, secret: string): string {
  const keys = Object.keys(params).sort();
  const base = keys.map((key) => `${key}${params[key]}`).join("");
  return createHash("md5")
    .update(base + secret, "utf-8")
    .digest("hex");
}

export async function signedRequest<T>(
  client: LastFM,
  method: string,
  params: Record<string, string | number>,
  options: SignedRequestOptions = {},
): Promise<T> {
  if (!client.apiSecret) {
    throw new AuthError(
      "This action needs a Last.fm API secret. Add one with `tsfm setup`.",
    );
  }

  const sessionKey = options.sessionKey ?? client.sessionKey;

  const stringParams: Record<string, string> = {
    method,
    api_key: client.apiKey,
    ...(sessionKey ? { sk: sessionKey } : {}),
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
  };

  const apiSig = signParams(stringParams, client.apiSecret);

  const body = new URLSearchParams({
    ...stringParams,
    api_sig: apiSig,
    format: "json",
  });

  const timeoutMs = options.timeoutMs ?? 8000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    logger.debug("Last.fm signed request", { method, params: stringParams });

    const response = await fetch(client.baseUrl, {
      method: "POST",
      headers: {
        "User-Agent": client.userAgent,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: controller.signal,
    });

    const text = await response.text();

    logger.debug("Last.fm signed response", {
      method,
      status: response.status,
      body: text,
    });

    if (!response.ok) {
      logger.error("Last.fm signed request failed", {
        method,
        status: response.status,
        body: text,
      });
      throw new Error(`Last.fm request failed (${response.status}): ${text}`);
    }

    const data: unknown = JSON.parse(text);

    if (isLastFMError(data)) {
      logger.error("Last.fm API error", {
        method,
        code: data.error,
        message: data.message,
      });
      throw new LastFMApiError(data.message, data.error);
    }

    logger.debug("Last.fm signed request completed", { method });

    return data as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      logger.warn("Last.fm signed request timed out", { method });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
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
