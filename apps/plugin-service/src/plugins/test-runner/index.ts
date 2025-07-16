// Judge0 API Client for Test Runner Plugin
// This module provides a complete TypeScript client for the Judge0 API

// Grade submission functionality
export { gradeSubmission } from "./grade";

// Main API client and types
export {
  isErrorStatus,
  isProcessingStatus,
  isSuccessStatus,
  judge0Api,
  Judge0ApiClient,
  LANGUAGE_IDS,
  pollSubmissionUntilComplete,
  STATUS_IDS,
} from "./judge0";

export type {
  About,
  BatchGetOptions,
  BatchGetResponse,
  BatchSubmissionResponse,
  ConfigInfo,
  CreateSubmissionResponse,
  Language,
  Statistics,
  StatisticsOptions,
  Status,
  SubmissionBatchOptions,
  SubmissionGetOptions,
  SubmissionInput,
  SubmissionResponse,
  SubmissionsListOptions,
  SubmissionsListResponse,
  SystemInfo,
  Version,
  Workers,
} from "./judge0";

// Examples and utilities
export {
  executeBatchSubmissions,
  executeHelloWorld,
  executePythonProgram,
  executeWithInput,
  getAvailableLanguages,
  getErrorMessage,
  getSystemConfiguration,
  isSubmissionSuccessful,
  runAllExamples,
  testCompilationError,
  testWithCustomLimits,
} from "./judge0-examples";
