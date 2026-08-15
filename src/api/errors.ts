// api/errors.ts
export class LastFMApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = "LastFMApiError";
    this.code = code;
  }
}
