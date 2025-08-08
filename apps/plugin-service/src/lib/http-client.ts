import type { DefaultError } from "@grading-system/utils/error";
import type { z } from "zod";
import { asError, CustomError } from "@grading-system/utils/error";
import ky, { HTTPError } from "ky";
import { ResultAsync } from "neverthrow";

// Custom error types that extend ky's HTTPError
// export class ValidationError extends Error {
//   constructor(
//     message: string,
//     public errors: z.ZodError,
//   ) {
//     super(message);
//     this.name = "ValidationError";
//   }
// }

class ValidationError extends CustomError.withTag("ValidationError")<void, z.ZodError> {}
class HttpClientError extends CustomError.withTag("HttpClientError")<void, HTTPError> {}

// Type-safe HTTP client options
export interface HttpClientOptions {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  hooks?: {
    beforeRequest?: Array<(request: Request) => void | Promise<void>>;
    afterResponse?: Array<(request: Request) => void | Promise<void>>;
  };
}

// Request configuration
export interface RequestConfig<TBody = unknown> {
  headers?: Record<string, string>;
  body?: TBody;
  timeout?: number;
  searchParams?: Record<string, string | number | boolean>;
  json?: TBody;
}

export interface HttpResponseMetadata {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: "basic" | "cors" | "default" | "error" | "opaque" | "opaqueredirect";
  readonly url: string;
  readonly redirected: boolean;
}

export interface HttpResponse<T> extends HttpResponseMetadata {
  data: T;
}

// Create a typesafe HTTP client using ky
export class TypesafeHttpClient {
  private client: typeof ky;

  constructor(options: HttpClientOptions = {}) {
    this.client = ky.create({
      prefixUrl: options.baseUrl ?? "",
      timeout: options.timeout ?? 30000,
      headers: options.headers ?? {},
      // retry: {
      //   limit: options.retries ?? 3,
      //   methods: ["get", "put", "head", "delete", "options", "trace"],
      //   statusCodes: [408, 413, 429, 500, 502, 503, 504],
      //   backoffLimit: 30000,
      // },
      // hooks: {
      //   beforeRequest: [
      //     (request) => {
      //       logger.debug(`Making ${request.method} request to ${request.url}`);
      //     },
      //     ...(options.hooks?.beforeRequest ?? []),
      //   ],
      //   afterResponse: [
      //     (request) => {
      //       logger.debug(`Request to ${request.url} completed successfully`);
      //     },
      //     ...(options.hooks?.afterResponse ?? []),
      //   ],
      // },
    });
  }

  // Main request method with full type safety
  private request<TResponse>(
    url: string,
    options: Parameters<typeof ky>[1] = {},
    responseSchema: z.ZodSchema<TResponse> | undefined,
  ): typeof responseSchema extends undefined ?
    ResultAsync<HttpResponse<TResponse>, HttpClientError | DefaultError>
  : ResultAsync<
      HttpResponse<TResponse>,
      HttpClientError | ValidationError | DefaultError
    > {
    return ResultAsync.fromPromise(
      this.executeRequest(url, options, responseSchema),
      (error) => {
        if (error instanceof ValidationError) {
          return error;
        }

        if (error instanceof HTTPError) {
          return new HttpClientError({ cause: error });
        }

        return asError(error);
      },
    );
  }

  private async executeRequest<TResponse>(
    url: string,
    options: Parameters<typeof ky>[1],
    responseSchema: z.ZodSchema<TResponse> | undefined,
  ): Promise<HttpResponse<TResponse>> {
    const response = await this.client(url, options);

    const responseMetadata: HttpResponseMetadata = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      type: response.type,
      url: response.url,
      redirected: response.redirected,
    };

    if (!responseSchema) {
      return {
        ...responseMetadata,
        data: await response.json() as unknown as TResponse,
      };
    }

    const responseJson = await response.json();

    // Validate response with Zod schema
    const parseResult = responseSchema.safeParse(responseJson);
    if (!parseResult.success) {
      throw new ValidationError({
        message: "Response validation failed",
        cause: parseResult.error,
      });
    }

    return {
      ...responseMetadata,
      data: parseResult.data,
    };
  }

  // Convenience methods with type safety
  get<TResponse>(
    url: string,
    config: Omit<RequestConfig, "body" | "json"> = {},
    responseSchema?: z.ZodSchema<TResponse>,
  ) {
    return this.request(
      url,
      {
        method: "get",
        headers: config.headers,
        timeout: config.timeout,
        searchParams: config.searchParams,
      },
      responseSchema,
    );
  }

  post<TBody, TResponse>(
    url: string,
    body: TBody,
    config: Omit<RequestConfig<TBody>, "body" | "json"> = {},
    responseSchema?: z.ZodSchema<TResponse>,
  ) {
    const data = body instanceof FormData ? { body: body as FormData } : { json: body };

    return this.request(
      url,
      {
        ...data,
        method: "post",
        headers: config.headers,
        timeout: config.timeout,
        searchParams: config.searchParams,
      },
      responseSchema,
    );
  }

  put<TBody, TResponse>(
    url: string,
    body: TBody,
    config: Omit<RequestConfig<TBody>, "body" | "json"> = {},
    responseSchema?: z.ZodSchema<TResponse>,
  ) {
    return this.request(
      url,
      {
        method: "put",
        json: body,
        headers: config.headers,
        timeout: config.timeout,
        searchParams: config.searchParams,
      },
      responseSchema,
    );
  }

  patch<TBody, TResponse>(
    url: string,
    body: TBody,
    config: Omit<RequestConfig<TBody>, "body" | "json"> = {},
    responseSchema?: z.ZodSchema<TResponse>,
  ) {
    return this.request(
      url,
      {
        method: "patch",
        json: body,
        headers: config.headers,
        timeout: config.timeout,
        searchParams: config.searchParams,
      },
      responseSchema,
    );
  }

  delete<TResponse>(
    url: string,
    config: Omit<RequestConfig, "body" | "json"> = {},
    responseSchema?: z.ZodSchema<TResponse>,
  ) {
    return this.request(
      url,
      {
        method: "delete",
        headers: config.headers,
        timeout: config.timeout,
        searchParams: config.searchParams,
      },
      responseSchema,
    );
  }

  // Raw ky instance for advanced usage
  get raw() {
    return this.client;
  }
}

// Export a default instance
export const httpClient = new TypesafeHttpClient();

// Helper function for creating clients with specific base URLs
export const createHttpClient = (options: HttpClientOptions) =>
  new TypesafeHttpClient(options);

// Re-export ky's HTTPError for convenience
export type { HTTPError } from "ky";
