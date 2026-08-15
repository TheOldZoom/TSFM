export class TsfmError extends Error {
  exitCode = 1;
}

export class CommandNotFoundError extends TsfmError {
  constructor(name: string) {
    super(`Unknown command: ${name}`);
  }
}

export class UsageError extends TsfmError {
  constructor(message: string) {
    super(message);
  }
}
