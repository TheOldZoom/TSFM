import * as p from "@clack/prompts";
import type { UiOptions } from "./options";

export async function withSpinner<T>(
  label: string,
  fn: () => Promise<T>,
  options: UiOptions,
): Promise<T> {
  if (options.quiet || options.output !== "pretty") {
    return fn();
  }

  const spinner = p.spinner();
  spinner.start(label);

  try {
    const result = await fn();
    spinner.stop(label);
    return result;
  } catch (err) {
    spinner.stop("Failed");
    throw err;
  }
}
