import { loadConfig } from "@/config";
import { LastFM } from "./client";

const config = loadConfig();
const LastFMClient = new LastFM({
  apiKey: config.lastfm.apiKey ?? "",
  apiSecret: config.lastfm.secret,
  sessionKey: config.lastfm.session?.key,
});
export default LastFMClient;
