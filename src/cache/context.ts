let cacheEnabled = true;
let offlineMode = false;

export function configureCache(options: {
  enabled?: boolean;
  offline?: boolean;
}): void {
  if (options.enabled !== undefined) cacheEnabled = options.enabled;
  if (options.offline !== undefined) offlineMode = options.offline;
}

export function isCacheEnabled(): boolean {
  return cacheEnabled || offlineMode;
}

export function isOfflineMode(): boolean {
  return offlineMode;
}

export function requireOnline(action: string): void {
  if (offlineMode) {
    throw new Error(
      `${action} requires network access and can't run in --offline mode.`,
    );
  }
}
