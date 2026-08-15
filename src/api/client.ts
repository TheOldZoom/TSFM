import { UserMethods } from "./methods/user";
import { TrackMethods } from "./methods/track";
import { ArtistMethods } from "./methods/artist";
import { AlbumMethods } from "./methods/album";
import { ChartMethods } from "./methods/chart";
import { AuthMethods } from "./methods/auth";

export interface LastFMOptions {
  apiKey: string;
  apiSecret?: string;
  sessionKey?: string;
}

export class LastFM {
  public readonly apiKey: string;
  public readonly apiSecret?: string;
  public sessionKey?: string;
  public readonly baseUrl: string;
  public readonly userAgent: string;

  public readonly user: UserMethods;
  public readonly track: TrackMethods;
  public readonly artist: ArtistMethods;
  public readonly album: AlbumMethods;
  public readonly chart: ChartMethods;
  public readonly auth: AuthMethods;

  constructor(options: LastFMOptions) {
    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    this.sessionKey = options.sessionKey;
    this.baseUrl = "https://ws.audioscrobbler.com/2.0";
    this.userAgent = "@theoldzoom/TSFM (+https://github.com/TheOldZoom/TSFM)";

    this.user = new UserMethods(this);
    this.track = new TrackMethods(this);
    this.artist = new ArtistMethods(this);
    this.album = new AlbumMethods(this);
    this.chart = new ChartMethods(this);
    this.auth = new AuthMethods(this);
  }
}
