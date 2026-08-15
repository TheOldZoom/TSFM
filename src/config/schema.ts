import { z } from "zod";

export const configSchema = z.object({
  lastfm: z.object({
    apiKey: z.string().min(1, "Last.fm API key cannot be empty").optional(),
    username: z.string().min(1, "Last.fm username cannot be empty").optional(),
  }),
});

export type Config = z.infer<typeof configSchema>;

export const defaultConfig: Config = {
  lastfm: {
    apiKey: undefined,
    username: undefined,
  },
};
