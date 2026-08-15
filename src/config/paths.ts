import { homedir } from "node:os";
import { join } from "node:path";
import { getEnv } from "@/libs/env";

export function getConfigDir(): string {
  const xdgConfigHome = getEnv("XDG_CONFIG_HOME");
  return xdgConfigHome && xdgConfigHome.length > 0
    ? xdgConfigHome
    : join(homedir(), ".config");
}

export function getConfigPath(): string {
  return join(getConfigDir(), "tsfm.yaml");
}
