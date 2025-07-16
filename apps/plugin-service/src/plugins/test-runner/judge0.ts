import type { Result } from "neverthrow";
import type { HTTPError, ValidationError } from "@/lib/http-client";
import process from "node:process";
import { z } from "zod";
import { createHttpClient } from "@/lib/http-client";

// Base URL for the Judge0 server
const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL;

if (JUDGE0_BASE_URL === undefined) {
  throw new Error("JUDGE0_BASE_URL environment variable is not set");
}

// Create a Judge0 HTTP client instance
const judge0Client = createHttpClient({
  baseUrl: JUDGE0_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// Zod Schemas for API Responses
// ============================================================================

// Status Schema
const StatusSchema = z.object({
  id: z.number(),
  description: z.string(),
});

// Language Schema
const LanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
});

// Submission Schema (for responses)
const SubmissionResponseSchema = z.object({
  token: z.string().optional(),
  stdout: z.string().nullable().optional(),
  stderr: z.string().nullable().optional(),
  compile_output: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  exit_code: z.number().nullable().optional(),
  exit_signal: z.number().nullable().optional(),
  status: StatusSchema.optional(),
  created_at: z.string().optional(),
  finished_at: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  wall_time: z.number().nullable().optional(),
  memory: z.number().nullable().optional(),
  source_code: z.string().optional(),
  language_id: z.number().optional(),
  stdin: z.string().nullable().optional(),
  expected_output: z.string().nullable().optional(),
  // Configuration fields
  cpu_time_limit: z.number().nullable().optional(),
  cpu_extra_time: z.number().nullable().optional(),
  wall_time_limit: z.number().nullable().optional(),
  memory_limit: z.number().nullable().optional(),
  stack_limit: z.number().nullable().optional(),
  max_processes_and_or_threads: z.number().nullable().optional(),
  enable_per_process_and_thread_time_limit: z.boolean().nullable().optional(),
  enable_per_process_and_thread_memory_limit: z.boolean().nullable().optional(),
  max_file_size: z.number().nullable().optional(),
  redirect_stderr_to_stdout: z.boolean().nullable().optional(),
  enable_network: z.boolean().nullable().optional(),
  number_of_runs: z.number().nullable().optional(),
  additional_files: z.string().nullable().optional(),
  callback_url: z.string().nullable().optional(),
  compiler_options: z.string().nullable().optional(),
  command_line_arguments: z.string().nullable().optional(),
});

// Create Submission Response Schema (when created)
const CreateSubmissionResponseSchema = z.object({
  token: z.string(),
  error: z.string().optional(),
});

// Submissions List Response Schema
const SubmissionsListResponseSchema = z.object({
  submissions: z.array(SubmissionResponseSchema),
  meta: z.object({
    current_page: z.number(),
    next_page: z.number().nullable(),
    prev_page: z.number().nullable(),
    total_pages: z.number(),
    total_count: z.number(),
  }),
});

// Batch Submission Response Schema
const BatchSubmissionResponseSchema = z.array(
  z.union([
    z.object({ token: z.string() }),
    z.record(z.array(z.string())), // For validation errors
  ]),
);

// Batch Get Response Schema
const BatchGetResponseSchema = z.object({
  submissions: z.array(SubmissionResponseSchema),
});

// Configuration Info Schema
const ConfigInfoSchema = z.object({
  enable_wait_result: z.boolean(),
  enable_compiler_options: z.boolean(),
  allowed_languages_for_compile_options: z.array(z.string()),
  enable_command_line_arguments: z.boolean(),
  enable_submission_delete: z.boolean(),
  max_queue_size: z.number(),
  cpu_time_limit: z.number(),
  max_cpu_time_limit: z.number(),
  cpu_extra_time: z.number(),
  max_cpu_extra_time: z.number(),
  wall_time_limit: z.number(),
  max_wall_time_limit: z.number(),
  memory_limit: z.number(),
  max_memory_limit: z.number(),
  stack_limit: z.number(),
  max_stack_limit: z.number(),
  max_processes_and_or_threads: z.number(),
  max_max_processes_and_or_threads: z.number(),
  enable_per_process_and_thread_time_limit: z.boolean(),
  allow_enable_per_process_and_thread_time_limit: z.boolean(),
  enable_per_process_and_thread_memory_limit: z.boolean(),
  allow_enable_per_process_and_thread_memory_limit: z.boolean(),
  max_file_size: z.number(),
  max_max_file_size: z.number(),
  number_of_runs: z.number(),
  max_number_of_runs: z.number(),
  allow_enable_network: z.boolean().optional(),
  enable_network: z.boolean().optional(),
});

// System Info Schema
const SystemInfoSchema = z.record(z.string());

// Workers Schema
const WorkersSchema = z.array(
  z.object({
    queue: z.string(),
    size: z.number(),
    available: z.number(),
    idle: z.number(),
    working: z.number(),
    paused: z.number(),
    failed: z.number(),
  }),
);

// Statistics Schema (basic response)
const StatisticsSchema = z.record(z.union([z.string(), z.number()]));

// About Schema
const AboutSchema = z.object({
  version: z.string(),
  homepage: z.string(),
  source_code: z.string(),
  maintainer: z.string(),
});

// Version Schema
const VersionSchema = z.object({
  version: z.string(),
});

// License/Isolate Schema (plain text)
const TextResponseSchema = z.string();

// Authentication/Authorization Response Schema
const AuthResponseSchema = z.union([
  z.object({}), // Success response (empty object)
  z.object({ error: z.string() }), // Error response
]);

// ============================================================================
// Type Definitions
// ============================================================================

export type Status = z.infer<typeof StatusSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type CreateSubmissionResponse = z.infer<typeof CreateSubmissionResponseSchema>;
export type SubmissionsListResponse = z.infer<typeof SubmissionsListResponseSchema>;
export type BatchSubmissionResponse = z.infer<typeof BatchSubmissionResponseSchema>;
export type BatchGetResponse = z.infer<typeof BatchGetResponseSchema>;
export type ConfigInfo = z.infer<typeof ConfigInfoSchema>;
export type SystemInfo = z.infer<typeof SystemInfoSchema>;
export type Workers = z.infer<typeof WorkersSchema>;
export type Statistics = z.infer<typeof StatisticsSchema>;
export type About = z.infer<typeof AboutSchema>;
export type Version = z.infer<typeof VersionSchema>;

// Submission Input Schema
export interface SubmissionInput {
  source_code?: string;
  language_id: number;
  compiler_options?: string;
  command_line_arguments?: string;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  cpu_extra_time?: number;
  wall_time_limit?: number;
  memory_limit?: number;
  stack_limit?: number;
  max_processes_and_or_threads?: number;
  enable_per_process_and_thread_time_limit?: boolean;
  enable_per_process_and_thread_memory_limit?: boolean;
  max_file_size?: number;
  redirect_stderr_to_stdout?: boolean;
  enable_network?: boolean;
  number_of_runs?: number;
  additional_files?: string; // Base64 encoded ZIP file
  callback_url?: string;
}

// Request configuration interfaces
export interface SubmissionGetOptions {
  base64_encoded?: boolean;
  fields?: string;
}

export interface SubmissionsListOptions {
  base64_encoded?: boolean;
  fields?: string;
  page?: number;
  per_page?: number;
}

export interface SubmissionBatchOptions {
  base64_encoded?: boolean;
}

export interface BatchGetOptions {
  base64_encoded?: boolean;
  fields?: string;
}

export interface StatisticsOptions {
  invalidate_cache?: boolean;
}

// ============================================================================
// Judge0 API Client Class
// ============================================================================

export class Judge0ApiClient {
  // Authentication Methods
  async authenticate(
    token?: string,
  ): Promise<
    Result<Record<string, never> | { error: string }, HTTPError | ValidationError | Error>
  > {
    const headers: Record<string, string> = {};
    if (token) {
      headers["X-Auth-Token"] = token;
    }
    return judge0Client.post("/authenticate", {}, AuthResponseSchema, { headers });
  }

  async authorize(
    token?: string,
    authUser?: string,
  ): Promise<
    Result<Record<string, never> | { error: string }, HTTPError | ValidationError | Error>
  > {
    const headers: Record<string, string> = {};
    if (token) headers["X-Auth-Token"] = token;
    if (authUser) headers["X-Auth-User"] = authUser;

    return judge0Client.post("/authorize", {}, AuthResponseSchema, { headers });
  }

  // Submission Methods
  async createSubmission(
    submission: SubmissionInput,
    options: { base64_encoded?: boolean; wait?: boolean } = {},
  ): Promise<
    Result<
      CreateSubmissionResponse | SubmissionResponse,
      HTTPError | ValidationError | Error
    >
  > {
    const searchParams: Record<string, string | boolean> = {};
    if (options.base64_encoded !== undefined)
      searchParams.base64_encoded = options.base64_encoded;
    if (options.wait !== undefined) searchParams.wait = options.wait;

    // Use union schema that can handle both response types
    const responseSchema = z.union([
      CreateSubmissionResponseSchema,
      SubmissionResponseSchema,
    ]);

    return judge0Client.post("/submissions/", submission, responseSchema, {
      searchParams,
    });
  }

  async getSubmission(
    token: string,
    options: SubmissionGetOptions = {},
  ): Promise<Result<SubmissionResponse, HTTPError | ValidationError | Error>> {
    const searchParams: Record<string, string | boolean> = {};
    if (options.base64_encoded !== undefined)
      searchParams.base64_encoded = options.base64_encoded;
    if (options.fields) searchParams.fields = options.fields;

    return judge0Client.get(`/submissions/${token}`, SubmissionResponseSchema, {
      searchParams,
    });
  }

  async getSubmissions(
    options: SubmissionsListOptions = {},
  ): Promise<Result<SubmissionsListResponse, HTTPError | ValidationError | Error>> {
    const searchParams: Record<string, string | boolean | number> = {};
    if (options.base64_encoded !== undefined)
      searchParams.base64_encoded = options.base64_encoded;
    if (options.fields) searchParams.fields = options.fields;
    if (options.page !== undefined) searchParams.page = options.page;
    if (options.per_page !== undefined) searchParams.per_page = options.per_page;

    return judge0Client.get("/submissions/", SubmissionsListResponseSchema, {
      searchParams,
    });
  }

  async deleteSubmission(
    token: string,
    options: { fields?: string } = {},
  ): Promise<Result<SubmissionResponse, HTTPError | ValidationError | Error>> {
    const searchParams: Record<string, string> = {};
    if (options.fields) searchParams.fields = options.fields;

    return judge0Client.delete(`/submissions/${token}`, SubmissionResponseSchema, {
      searchParams,
    });
  }

  // Batch Submission Methods
  async createSubmissionBatch(
    submissions: SubmissionInput[],
    options: SubmissionBatchOptions = {},
  ): Promise<Result<BatchSubmissionResponse, HTTPError | ValidationError | Error>> {
    const searchParams: Record<string, string | boolean> = {};
    if (options.base64_encoded !== undefined)
      searchParams.base64_encoded = options.base64_encoded;

    return judge0Client.post(
      "/submissions/batch",
      { submissions },
      BatchSubmissionResponseSchema,
      { searchParams },
    );
  }

  async getSubmissionBatch(
    tokens: string[],
    options: BatchGetOptions = {},
  ): Promise<Result<BatchGetResponse, HTTPError | ValidationError | Error>> {
    const searchParams: Record<string, string | boolean> = {
      tokens: tokens.join(","),
    };
    if (options.base64_encoded !== undefined)
      searchParams.base64_encoded = options.base64_encoded;
    if (options.fields) searchParams.fields = options.fields;

    return judge0Client.get("/submissions/batch", BatchGetResponseSchema, {
      searchParams,
    });
  }

  // Languages and Statuses Methods
  async getLanguages(): Promise<Result<Language[], HTTPError | ValidationError | Error>> {
    return judge0Client.get("/languages/", z.array(LanguageSchema));
  }

  async getLanguage(
    id: number,
  ): Promise<Result<Language, HTTPError | ValidationError | Error>> {
    return judge0Client.get(`/languages/${id}`, LanguageSchema);
  }

  async getActiveAndArchivedLanguages(): Promise<
    Result<Language[], HTTPError | ValidationError | Error>
  > {
    return judge0Client.get("/languages/all", z.array(LanguageSchema));
  }

  async getStatuses(): Promise<Result<Status[], HTTPError | ValidationError | Error>> {
    return judge0Client.get("/statuses", z.array(StatusSchema));
  }

  // System and Configuration Methods
  async getSystemInfo(): Promise<
    Result<SystemInfo, HTTPError | ValidationError | Error>
  > {
    return judge0Client.get("/system_info", SystemInfoSchema);
  }

  async getConfigInfo(): Promise<
    Result<ConfigInfo, HTTPError | ValidationError | Error>
  > {
    return judge0Client.get("/config_info", ConfigInfoSchema);
  }

  // Statistics Method
  async getStatistics(
    options: StatisticsOptions = {},
  ): Promise<Result<Statistics, HTTPError | ValidationError | Error>> {
    const searchParams: Record<string, string | boolean> = {};
    if (options.invalidate_cache !== undefined)
      searchParams.invalidate_cache = options.invalidate_cache;

    return judge0Client.get("/statistics", StatisticsSchema, { searchParams });
  }

  // Health Check Method
  async getWorkers(): Promise<Result<Workers, HTTPError | ValidationError | Error>> {
    return judge0Client.get("/workers", WorkersSchema);
  }

  // Information Methods
  async getAbout(): Promise<Result<About, HTTPError | ValidationError | Error>> {
    return judge0Client.get("/about", AboutSchema);
  }

  async getVersion(): Promise<Result<Version, HTTPError | ValidationError | Error>> {
    return judge0Client.get("/version", VersionSchema);
  }

  async getIsolate(): Promise<Result<string, HTTPError | ValidationError | Error>> {
    return judge0Client.get("/isolate", TextResponseSchema);
  }

  async getLicense(): Promise<Result<string, HTTPError | ValidationError | Error>> {
    return judge0Client.get("/license", TextResponseSchema);
  }
}

// ============================================================================
// Export Default Instance and Utilities
// ============================================================================

// Default instance
export const judge0Api = new Judge0ApiClient();

// Common Language IDs (based on documentation)
export const LANGUAGE_IDS = {
  ASSEMBLY_NASM: 45,
  BASH: 46,
  BASIC: 47,
  C_GCC_7_4_0: 48,
  C_GCC_8_3_0: 49,
  C_GCC_9_2_0: 50,
  C_SHARP_MONO: 51,
  C_PLUS_PLUS_GCC_7_4_0: 52,
  C_PLUS_PLUS_GCC_8_3_0: 53,
  C_PLUS_PLUS_GCC_9_2_0: 54,
  COMMON_LISP: 55,
  D: 56,
  ELIXIR: 57,
  ERLANG: 58,
  EXECUTABLE: 44,
  FORTRAN: 59,
  GO: 60,
  HASKELL: 61,
  JAVA_8: 62,
  JAVA_11: 63,
  JAVA_13: 64,
  JAVASCRIPT: 63,
  KOTLIN: 78,
  LUA: 64,
  MULTI_FILE_PROGRAM: 89,
  OBJECTIVE_C: 79,
  OCAML: 65,
  OCTAVE: 66,
  PASCAL_FPC: 67,
  PERL: 85,
  PHP: 68,
  PLAIN_TEXT: 43,
  PROLOG: 69,
  PYTHON_2_7: 70,
  PYTHON_3_6: 71,
  PYTHON_3_8: 72,
  R: 80,
  RUBY: 72,
  RUST: 73,
  SCALA: 81,
  SQL_SQLITE: 82,
  SWIFT: 83,
  TYPESCRIPT_3_7_4: 74,
  VISUAL_BASIC_NET: 84,
} as const;

// Common Status IDs (based on documentation)
export const STATUS_IDS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
} as const;

// Helper functions
export const isSuccessStatus = (statusId: number): boolean =>
  statusId === STATUS_IDS.ACCEPTED;
export const isErrorStatus = (statusId: number): boolean =>
  statusId >= STATUS_IDS.WRONG_ANSWER;
export const isProcessingStatus = (statusId: number): boolean =>
  statusId === STATUS_IDS.IN_QUEUE || statusId === STATUS_IDS.PROCESSING;

// Utility function for polling submission status
export const pollSubmissionUntilComplete = async (
  token: string,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (submission: SubmissionResponse) => void;
  } = {},
): Promise<
  Result<
    SubmissionResponse,
    HTTPError | ValidationError | Error | { error: "max_attempts_exceeded" }
  >
> => {
  const { maxAttempts = 30, intervalMs = 1000, onProgress } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await judge0Api.getSubmission(token);

    if (result.isErr()) {
      return result;
    }

    const submission = result.value;
    onProgress?.(submission);

    if (submission.status && !isProcessingStatus(submission.status.id)) {
      return result;
    }

    // Wait before next attempt (except for last attempt)
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  return {
    isErr: () => true,
    error: { error: "max_attempts_exceeded" as const },
  } as any;
};

export default judge0Api;
