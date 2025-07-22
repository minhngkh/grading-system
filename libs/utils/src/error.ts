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

export type ErrorInfo<TCause extends Error | unknown> =
  TCause extends Error ?
    {
      message?: string;
      cause: TCause;
    }
  : {
      message?: string;
      cause?: TCause;
    };

export abstract class CustomError<
  TData extends object | void,
  TTag extends string,
  TCause extends Error | unknown = unknown,
> extends Error {
  data: TData;
  _tag: TTag;
  override cause!: ErrorInfo<TCause>["cause"];

  protected constructor(info: ErrorInfo<TCause>, data: TData, tag: TTag) {
    super(info.message, { cause: info.cause });
    super.name = tag;
    this._tag = tag;
    this.data = data;
  }

  static withTag<TTag extends string>(tag: TTag) {
    return class<
      TData extends object | void,
      TCause extends Error | unknown = unknown,
    > extends CustomError<TData, TTag, TCause> {
      constructor(
        info: TData extends void ? ErrorInfo<TCause>
        : ErrorInfo<TCause> & { data: TData },
      ) {
        super(info, ("data" in info ? info.data : undefined) as TData, tag);
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

export class DefaultError extends CustomError.withTag("DefaultError")<void> {}

function toDefaultError(error: Error): DefaultError {
  const err = error as DefaultError;
  err._tag = "DefaultError";
  return err;
}

// No idea if this is the best way to do this, but it works for now
export function asError(thrown: unknown): DefaultError {
  if (thrown instanceof Error) {
    return toDefaultError(thrown);
  }

  try {
    return new DefaultError({
      message: JSON.stringify(thrown),
    });
  } catch {
    // fallback in case there's an error stringify-ing.
    // for example, due to circular references.
    return new DefaultError({
      message: String(thrown),
    });
  }
}

export function wrapError(err: unknown, message: string): DefaultError {
  return new DefaultError({
    message,
    cause: asError(err),
  });
}
