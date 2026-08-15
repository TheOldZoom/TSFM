export interface Config {
  lastfm: {
    apiKey?: string;
    username?: string;
    secret?: string;
    session?: {
      key: string;
      username: string;
    };
  };
  appearance: {
    images: boolean;
    imageMode: "auto" | "ansi";
    imageSize: "compact" | "normal" | "large";
    imageWidth?: number;
    imageMaxWidth: number;
    imageSpacing: number;
  };
  cache: {
    enabled: boolean;
  };
}
