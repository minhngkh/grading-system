import type { Result } from "neverthrow";
import type { z } from "zod";
import { asError } from "@grading-system/utils/error";
import ky, { HTTPError } from "ky";
import { ResultAsync } from "neverthrow";

// Custom error types that extend ky's HTTPError
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

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
  private async request<TResponse>(
    url: string,
    options: Parameters<typeof ky>[1] = {},
    responseSchema: z.ZodSchema<TResponse>,
  ): Promise<Result<TResponse, HTTPError | ValidationError | Error>> {
    return ResultAsync.fromPromise(
      this.executeRequest(url, options, responseSchema),
      (error) => {
        if (error instanceof ValidationError) {
          return error;
        }

        if (error instanceof HTTPError) {
          return error;
        }

        return asError(error);
      },
    );
  }

  private async executeRequest<TResponse>(
    url: string,
    options: Parameters<typeof ky>[1],
    responseSchema: z.ZodSchema<TResponse>,
  ): Promise<TResponse> {
    const response = await this.client(url, options);
    const rawData = await response.json();

    // Validate response with Zod schema
    const parseResult = responseSchema.safeParse(rawData);
    if (!parseResult.success) {
      throw new ValidationError("Response validation failed", parseResult.error);
    }

    return parseResult.data;
  }

  // Convenience methods with type safety
  async get<TResponse>(
    url: string,
    responseSchema: z.ZodSchema<TResponse>,
    config: Omit<RequestConfig, "body" | "json"> = {},
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

  async post<TBody, TResponse>(
    url: string,
    body: TBody,
    responseSchema: z.ZodSchema<TResponse>,
    config: Omit<RequestConfig<TBody>, "body" | "json"> = {},
  ) {
    return this.request(
      url,
      {
        method: "post",
        json: body,
        headers: config.headers,
        timeout: config.timeout,
        searchParams: config.searchParams,
      },
      responseSchema,
    );
  }

  async put<TBody, TResponse>(
    url: string,
    body: TBody,
    responseSchema: z.ZodSchema<TResponse>,
    config: Omit<RequestConfig<TBody>, "body" | "json"> = {},
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

  async patch<TBody, TResponse>(
    url: string,
    body: TBody,
    responseSchema: z.ZodSchema<TResponse>,
    config: Omit<RequestConfig<TBody>, "body" | "json"> = {},
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

  async delete<TResponse>(
    url: string,
    responseSchema: z.ZodSchema<TResponse>,
    config: Omit<RequestConfig, "body" | "json"> = {},
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
