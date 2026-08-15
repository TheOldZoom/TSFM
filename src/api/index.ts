import { LastFM } from "./client";

const LastFMClient = new LastFM({
  apiKey: process.env.LASTFM_API_KEY!,
});

export default LastFMClient;
