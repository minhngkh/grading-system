export type CustomErrorInfo = {
  message?: string;
  cause?: unknown;
};

export type ErrorInfo = {
  message?: string;
  options?: ErrorOptions;
};

export class CustomError<TData> extends Error {
  data: TData;
  constructor(info: ErrorInfo & { data: TData }) {
    super(info?.message, info?.options);
    this.data = info.data;
  }
}

export type ErrorInfoV2 = {
  message?: string;
  cause?: unknown;
};

export abstract class CustomErrorV2 {
  static Tag<TTag extends string>(tag: TTag) {
    return class<TData> extends Error {
      data: TData;
      override name: TTag;
      constructor(
        info: object extends TData ? ErrorInfoV2 : ErrorInfoV2 & { data: TData },
      ) {
        super(info.message, { cause: info.cause });
        this.name = tag;
        this.data = "data" in info ? info.data : ({} as TData);
      }
    };
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

export function wrapError(err: unknown, message: string) {
  return new Error(message, { cause: asError(err) });
}
