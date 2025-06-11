export type CustomErrorInfo = {
  cause?: unknown;
  message?: string;
  displayedMessage?: string | null;
};

export class CustomError extends Error {
  displayedMessage: string | null;

  /**
   * `displayedMessage` if not provided will default to `message`.
   */
  constructor(options?: CustomErrorInfo) {
    super(options?.message, {
      cause: options?.cause,
    });

    this.displayedMessage =
      typeof options?.displayedMessage !== "undefined" ?
        options.displayedMessage
      : (options?.message ?? null);

    this.name = "CustomError";
  }
}

export function asError(thrown: unknown): Error {
  if (thrown instanceof Error) {
    return thrown;
  }

  try {
    return new Error(JSON.stringify(thrown));
  } catch {
    // fallback in case there's an error stringify-ing.
    // for example, due to circular references.
    return new Error(String(thrown));
  }
}

export function wrapError(err: unknown, message: string): Error {
  return new Error(message, { cause: asError(err) });
}
