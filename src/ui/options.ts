export interface UiOptions {
  color: boolean;
  quiet: boolean;
  verbose: boolean;
  images: boolean;
  imageMode: "auto" | "ansi";
}

export const defaultUiOptions: UiOptions = {
  color: true,
  quiet: false,
  verbose: false,
  images: true,
  imageMode: "auto",
};

const GLOBAL_FLAGS = new Set([
  "--no-color",
  "--quiet",
  "-q",
  "--verbose",
  "-v",
  "--images",
  "--no-images",
]);

export function isGlobalFlag(arg: string): boolean {
  return GLOBAL_FLAGS.has(arg);
}

export function parseGlobalFlags(argv: string[]): {
  options: UiOptions;
  args: string[];
  imagesOverride?: boolean;
} {
  const options: UiOptions = { ...defaultUiOptions };
  const args: string[] = [];
  let imagesOverride: boolean | undefined;

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

  return { options, args, imagesOverride };
}

export function parseCommandArgv(argv: string[]): {
  commandName?: string;
  commandArgs: string[];
  options: UiOptions;
  imagesOverride?: boolean;
} {
  const { options, args, imagesOverride } = parseGlobalFlags(argv);
  const [commandName, ...commandArgs] = args;

  return { commandName, commandArgs, options, imagesOverride };
}
