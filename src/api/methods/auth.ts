import type { LastFM } from "../client";
import { signedRequest } from "../request";

export interface LastFMSession {
  name: string;
  key: string;
  subscriber: string;
}

export class AuthMethods {
  constructor(private readonly client: LastFM) {}

  async getMobileSession(
    username: string,
    password: string,
  ): Promise<LastFMSession> {
    const response = await signedRequest<{ session: LastFMSession }>(
      this.client,
      "auth.getMobileSession",
      { username, password },
    );
    return response.session;
  }
}
