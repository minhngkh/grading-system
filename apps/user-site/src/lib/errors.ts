export type CustomError = {
  type: string;
  stack?: string;
  internalMessage?: string;
  displayedMessage?: string;
};

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

// TODO: No cause in ES2020, consider update
export function wrapError(err: Error, message: string, includeChildMessage: boolean = false): Error {
  if (includeChildMessage) {
    return new Error(`${message}: ${err.message}`);
  }
  return new Error(message);
}


export function toCustomError<T extends CustomError>(
  err: Error,
  props: Partial<T>,
): T {
  return {
    ...{
      internalMessage: err.message,
      stack: err.stack,
    },
    ...props,
  } as T;
}

export function customError<T extends CustomError>(props: Partial<T>): T {
  return {
    ...{
      // eslint-disable-next-line unicorn/error-message
      stack: new Error().stack,
    },
    ...props,
  } as T;
}
