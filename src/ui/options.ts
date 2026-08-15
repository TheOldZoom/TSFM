export interface UiOptions {
  color: boolean;
  quiet: boolean;
  verbose: boolean;
  images: boolean;
  imageMode: "auto" | "ansi";
  output: "pretty" | "json" | "csv";
  cache: boolean;
  offline: boolean;
}

export const defaultUiOptions: UiOptions = {
  color: true,
  quiet: false,
  verbose: false,
  images: true,
  imageMode: "auto",
  output: "pretty",
  cache: true,
  offline: false,
};

const GLOBAL_FLAGS = new Set([
  "--no-color",
  "--quiet",
  "-q",
  "--verbose",
  "-v",
  "--images",
  "--no-images",
  "--json",
  "--csv",
  "--no-cache",
  "--offline",
]);

export function isGlobalFlag(arg: string): boolean {
  return GLOBAL_FLAGS.has(arg);
}

export function parseGlobalFlags(argv: string[]): {
  options: UiOptions;
  args: string[];
  imagesOverride?: boolean;
  outputOverride?: "json" | "csv";
} {
  const options: UiOptions = { ...defaultUiOptions };
  const args: string[] = [];
  let imagesOverride: boolean | undefined;
  let outputOverride: "json" | "csv" | undefined;

  for (const arg of argv) {
    switch (arg) {
      case "--no-color":
        options.color = false;
        break;
      case "--quiet":
      case "-q":
        options.quiet = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--images":
        imagesOverride = true;
        break;
      case "--no-images":
        imagesOverride = false;
        break;
      case "--json":
        outputOverride = "json";
        break;
      case "--csv":
        outputOverride = "csv";
        break;
      case "--no-cache":
        options.cache = false;
        break;
      case "--offline":
        options.offline = true;
        break;
      default:
        args.push(arg);
    }
  }

  if (process.env.NO_COLOR !== undefined) {
    options.color = false;
  }

  if (
    process.env.FORCE_COLOR !== undefined &&
    process.env.FORCE_COLOR !== "0"
  ) {
    options.color = true;
  } else if (!process.stdout.isTTY) {
    options.color = false;
  }

  if (imagesOverride === true) {
    options.color = true;
  }

  return { options, args, imagesOverride, outputOverride };
}

export function parseCommandArgv(argv: string[]): {
  commandName?: string;
  commandArgs: string[];
  options: UiOptions;
  imagesOverride?: boolean;
  outputOverride?: "json" | "csv";
} {
  const { options, args, imagesOverride, outputOverride } =
    parseGlobalFlags(argv);
  const [commandName, ...commandArgs] = args;

  return { commandName, commandArgs, options, imagesOverride, outputOverride };
}
