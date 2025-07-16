# Judge0 API Client

A comprehensive TypeScript client for the Judge0 API that provides type-safe access to all Judge0 endpoints. This client is built using your existing `http-client` infrastructure and provides full type safety with Zod schema validation.

## Features

- ✅ **Complete API Coverage**: All Judge0 endpoints are implemented
- ✅ **Type Safety**: Full TypeScript support with Zod schema validation
- ✅ **Error Handling**: Robust error handling with Result types
- ✅ **Async/Await**: Modern async/await API
- ✅ **Base64 Support**: Automatic handling of Base64 encoded data
- ✅ **Batch Operations**: Support for batch submission creation and retrieval
- ✅ **Polling Utilities**: Built-in submission status polling
- ✅ **Language Constants**: Pre-defined language and status ID constants

## Files

- `judge0.ts` - Main API client implementation
- `judge0-examples.ts` - Usage examples and utility functions
- `README.md` - This documentation

## Basic Usage

### Import the Client

```typescript
import { judge0Api, LANGUAGE_IDS, STATUS_IDS } from './judge0';
```

### Execute Code

```typescript
// Simple code execution
const result = await judge0Api.createSubmission({
  source_code: `
    #include <stdio.h>
    int main() {
        printf("Hello, World!\\n");
        return 0;
    }
  `,
  language_id: LANGUAGE_IDS.C_GCC_9_2_0,
});

if (result.isOk()) {
  const token = result.value.token;
  // Poll for results or get submission status
}
```

### Get Submission Results

```typescript
// Get submission result
const submission = await judge0Api.getSubmission(token);

if (submission.isOk()) {
  console.log("Output:", submission.value.stdout);
  console.log("Status:", submission.value.status?.description);
}
```

### Poll Until Complete

```typescript
import { pollSubmissionUntilComplete } from './judge0';

const result = await pollSubmissionUntilComplete(token, {
  maxAttempts: 30,
  intervalMs: 1000,
  onProgress: (submission) => {
    console.log(`Status: ${submission.status?.description}`);
  },
});

if (result.isOk()) {
  console.log("Final result:", result.value.stdout);
}
```

## API Methods

### Authentication

```typescript
// Check authentication (if required)
await judge0Api.authenticate(token);

// Check authorization (if required)
await judge0Api.authorize(token, authUser);
```

### Submissions

```typescript
// Create single submission
await judge0Api.createSubmission(submissionData, options);

// Get submission by token
await judge0Api.getSubmission(token, options);

// List all submissions (requires authorization)
await judge0Api.getSubmissions(options);

// Delete submission (requires authorization)
await judge0Api.deleteSubmission(token, options);

// Create batch submissions
await judge0Api.createSubmissionBatch(submissions, options);

// Get batch submissions
await judge0Api.getSubmissionBatch(tokens, options);
```

### Languages and Statuses

```typescript
// Get available languages
await judge0Api.getLanguages();

// Get specific language
await judge0Api.getLanguage(languageId);

// Get all languages (including archived)
await judge0Api.getActiveAndArchivedLanguages();

// Get status definitions
await judge0Api.getStatuses();
```

### System Information

```typescript
// Get system configuration
await judge0Api.getConfigInfo();

// Get system information
await judge0Api.getSystemInfo();

// Get worker status
await judge0Api.getWorkers();

// Get statistics
await judge0Api.getStatistics(options);
```

### Information

```typescript
// Get general information
await judge0Api.getAbout();

// Get version
await judge0Api.getVersion();

// Get isolate information
await judge0Api.getIsolate();

// Get license
await judge0Api.getLicense();
```

## Configuration Options

### Submission Options

```typescript
interface SubmissionInput {
  source_code?: string;           // Program source code
  language_id: number;            // Programming language ID
  compiler_options?: string;      // Compiler flags
  command_line_arguments?: string; // CLI arguments
  stdin?: string;                 // Program input
  expected_output?: string;       // Expected output for comparison
  
  // Resource limits
  cpu_time_limit?: number;        // CPU time limit (seconds)
  cpu_extra_time?: number;        // Extra time buffer (seconds)
  wall_time_limit?: number;       // Wall clock time limit (seconds)
  memory_limit?: number;          // Memory limit (KB)
  stack_limit?: number;           // Stack limit (KB)
  max_processes_and_or_threads?: number; // Max processes/threads
  max_file_size?: number;         // Max file size (KB)
  number_of_runs?: number;        // Number of runs to average
  
  // Options
  enable_per_process_and_thread_time_limit?: boolean;
  enable_per_process_and_thread_memory_limit?: boolean;
  redirect_stderr_to_stdout?: boolean;
  enable_network?: boolean;
  
  // Advanced
  additional_files?: string;      // Base64 encoded ZIP file
  callback_url?: string;          // Webhook URL
}
```

### Query Options

```typescript
interface SubmissionGetOptions {
  base64_encoded?: boolean;       // Get Base64 encoded response
  fields?: string;                // Comma-separated field list
}

interface SubmissionsListOptions extends SubmissionGetOptions {
  page?: number;                  // Page number
  per_page?: number;              // Items per page
}
```

## Language IDs

Common language IDs are available as constants:

```typescript
LANGUAGE_IDS.C_GCC_9_2_0          // 50
LANGUAGE_IDS.C_PLUS_PLUS_GCC_9_2_0 // 54
LANGUAGE_IDS.PYTHON_3_8           // 72
LANGUAGE_IDS.JAVASCRIPT           // 63
LANGUAGE_IDS.JAVA_11              // 63
LANGUAGE_IDS.RUBY                 // 72
LANGUAGE_IDS.GO                   // 60
LANGUAGE_IDS.RUST                 // 73
// ... and many more
```

## Status IDs

Submission status constants:

```typescript
STATUS_IDS.IN_QUEUE               // 1
STATUS_IDS.PROCESSING             // 2
STATUS_IDS.ACCEPTED               // 3
STATUS_IDS.WRONG_ANSWER           // 4
STATUS_IDS.TIME_LIMIT_EXCEEDED    // 5
STATUS_IDS.COMPILATION_ERROR      // 6
STATUS_IDS.RUNTIME_ERROR_SIGSEGV  // 7
// ... and more
```

## Utility Functions

```typescript
// Check if submission was successful
isSuccessStatus(statusId): boolean

// Check if submission had errors
isErrorStatus(statusId): boolean

// Check if submission is still processing
isProcessingStatus(statusId): boolean

// Poll submission until complete
pollSubmissionUntilComplete(token, options)
```

## Error Handling

All methods return `Result<T, Error>` types for safe error handling:

```typescript
const result = await judge0Api.createSubmission(data);

if (result.isErr()) {
  // Handle different error types
  if (result.error instanceof HTTPError) {
    console.error("HTTP Error:", result.error.response.status);
  } else if (result.error instanceof ValidationError) {
    console.error("Validation Error:", result.error.errors);
  } else {
    console.error("Unknown Error:", result.error.message);
  }
} else {
  // Success case
  console.log("Submission created:", result.value.token);
}
```

## Examples

See `judge0-examples.ts` for comprehensive usage examples including:

- Basic code execution
- Programs with input/output
- Different programming languages
- Batch submissions
- Error handling
- Custom resource limits
- And more!

To run all examples:

```typescript
import { runAllExamples } from './judge0-examples';
await runAllExamples();
```

## Base URL Configuration

The client is configured to use:
```
https://judge0-server.delightfulbeach-c2db7502.southeastasia.azurecontainerapps.io
```

To use a different Judge0 instance, modify the `JUDGE0_BASE_URL` constant in `judge0.ts`.

## Rate Limiting and Best Practices

1. **Polling**: Use the built-in `pollSubmissionUntilComplete` function instead of manual polling
2. **Batch Operations**: Use batch APIs when submitting multiple programs
3. **Resource Limits**: Set appropriate time and memory limits to prevent resource exhaustion
4. **Error Handling**: Always check for errors and handle them appropriately
5. **Base64**: Use `base64_encoded=true` when dealing with binary data or non-printable characters

## Advanced Usage

### Multi-file Programs

For complex programs with multiple files:

```typescript
// Create a ZIP file with all source files and encode as Base64
const additionalFiles = createZipAndEncode([
  { name: 'main.cpp', content: mainSource },
  { name: 'utils.h', content: headerSource },
  { name: 'compile', content: compileScript },
  { name: 'run', content: runScript },
]);

await judge0Api.createSubmission({
  language_id: LANGUAGE_IDS.MULTI_FILE_PROGRAM,
  additional_files: additionalFiles,
});
```

### Custom Fields

Retrieve only specific fields to reduce bandwidth:

```typescript
const result = await judge0Api.getSubmission(token, {
  fields: 'stdout,stderr,status,time,memory'
});
```

### Webhooks

Use callbacks for async processing:

```typescript
await judge0Api.createSubmission({
  source_code: code,
  language_id: LANGUAGE_IDS.PYTHON_3_8,
  callback_url: 'https://your-server.com/webhook'
});
```
