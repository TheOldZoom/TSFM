import { z } from "zod";

export const configSchema = z.object({
  lastfm: z.object({
    apiKey: z.string().min(1, "Last.fm API key cannot be empty").optional(),
    username: z.string().min(1, "Last.fm username cannot be empty").optional(),
    secret: z.string().min(1, "Last.fm API secret cannot be empty").optional(),
    session: z
      .object({
        key: z.string().min(1),
        username: z.string().min(1),
      })
      .optional(),
  }),
  appearance: z.object({
    images: z.boolean(),
    imageMode: z.enum(["auto", "ansi"]).default("auto"),
    imageSize: z.enum(["compact", "normal", "large"]).default("normal"),
    imageWidth: z.number().int().min(4).max(80).optional(),
    imageMaxWidth: z.number().int().min(8).max(80).default(40),
    imageSpacing: z.number().int().min(0).max(8).default(2),
  }),
  cache: z
    .object({
      enabled: z.boolean().default(true),
    })
    .default({ enabled: true }),
});

export type Config = z.infer<typeof configSchema>;

export const defaultConfig: Config = {
  lastfm: {
    apiKey: undefined,
    username: undefined,
    secret: undefined,
    session: undefined,
  },
  appearance: {
    images: true,
    imageMode: "auto",
    imageSize: "normal",
    imageWidth: undefined,
    imageMaxWidth: 40,
    imageSpacing: 2,
  },
  cache: {
    enabled: true,
  },
};
