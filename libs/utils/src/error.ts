export type CustomErrorInfo = {
  message?: string;
  cause?: unknown;
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

export function wrapError(err: unknown, message: string): Error {
  return new Error(message, { cause: asError(err) });
}
