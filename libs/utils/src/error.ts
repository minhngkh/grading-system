export type ErrorInfoV0 = {
  message?: string;
  options?: ErrorOptions;
};

export class CustomErrorV0<TData> extends Error {
  data: TData;
  constructor(info: ErrorInfoV0 & { data: TData }) {
    super(info?.message, info?.options);
    this.data = info.data;
  }
}

export type ErrorInfo = {
  message?: string;
  cause?: unknown;
};

export abstract class CustomError<TData extends object | void> extends Error {
  data: TData;
  _tag: string;

  protected constructor(info: ErrorInfo, data: TData, tag: string) {
    super(info.message, { cause: info.cause });
    super.name = tag;
    this._tag = tag;
    this.data = data;
  }

  static withTag<TTag extends string>(tag: TTag) {
    return class<TData extends object | void> extends CustomError<TData> {
      override _tag: TTag;

      constructor(info: TData extends void ? ErrorInfo : ErrorInfo & { data: TData }) {
        super(info, ("data" in info ? info.data : undefined) as TData, tag);
        this._tag = tag;
      }
    };
  }

  static from<TTag extends string>(error: unknown, tag: TTag = "DefaultError" as TTag) {
    // prettier-ignore
    return new (CustomError.withTag(tag)<void>)({
      cause: error,
    });
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
