import { judge0Api, LANGUAGE_IDS, pollSubmissionUntilComplete, STATUS_IDS } from "./judge0";

/**
 * Example usage of the Judge0 API client
 * This file demonstrates how to use various Judge0 API methods
 */

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Get all available languages
 */
export async function getAvailableLanguages() {
  const result = await judge0Api.getLanguages();
  
  if (result.isErr()) {
    console.error("Failed to get languages:", result.error);
    return null;
  }
  
  console.log("Available languages:", result.value);
  return result.value;
}

/**
 * Get system configuration information
 */
export async function getSystemConfiguration() {
  const configResult = await judge0Api.getConfigInfo();
  const systemResult = await judge0Api.getSystemInfo();
  
  if (configResult.isErr()) {
    console.error("Failed to get config info:", configResult.error);
    return null;
  }
  
  if (systemResult.isErr()) {
    console.error("Failed to get system info:", systemResult.error);
    return null;
  }
  
  return {
    config: configResult.value,
    system: systemResult.value,
  };
}

/**
 * Execute a simple "Hello World" program
 */
export async function executeHelloWorld() {
  const sourceCode = `
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
  `.trim();
  
  // Create submission
  const createResult = await judge0Api.createSubmission({
    source_code: sourceCode,
    language_id: LANGUAGE_IDS.C_GCC_9_2_0,
  });
  
  if (createResult.isErr()) {
    console.error("Failed to create submission:", createResult.error);
    return null;
  }
  
  const token = createResult.value.token;
  if (!token) {
    console.error("No token received");
    return null;
  }
  
  console.log("Submission created with token:", token);
  
  // Poll for result
  const result = await pollSubmissionUntilComplete(token, {
    onProgress: (submission) => {
      console.log(`Status: ${submission.status?.description || "Unknown"}`);
    },
  });
  
  if (result.isErr()) {
    console.error("Failed to get submission result:", result.error);
    return null;
  }
  
  const submission = result.value;
  console.log("Execution completed!");
  console.log("Status:", submission.status?.description);
  console.log("Output:", submission.stdout);
  console.log("Execution time:", submission.time, "seconds");
  console.log("Memory used:", submission.memory, "KB");
  
  return submission;
}

/**
 * Execute a program with input
 */
export async function executeWithInput() {
  const sourceCode = `
#include <stdio.h>

int main() {
    char name[100];
    printf("Enter your name: ");
    scanf("%s", name);
    printf("Hello, %s!\\n", name);
    return 0;
}
  `.trim();
  
  const createResult = await judge0Api.createSubmission({
    source_code: sourceCode,
    language_id: LANGUAGE_IDS.C_GCC_9_2_0,
    stdin: "Alice",
  });
  
  if (createResult.isErr()) {
    console.error("Failed to create submission:", createResult.error);
    return null;
  }
  
  const token = createResult.value.token;
  if (!token) {
    console.error("No token received");
    return null;
  }
  
  const result = await pollSubmissionUntilComplete(token);
  
  if (result.isErr()) {
    console.error("Failed to get submission result:", result.error);
    return null;
  }
  
  console.log("Program output:", result.value.stdout);
  return result.value;
}

/**
 * Execute a Python program
 */
export async function executePythonProgram() {
  const sourceCode = `
import sys

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Read input
n = int(input())
result = fibonacci(n)
print(f"Fibonacci({n}) = {result}")
  `.trim();
  
  const createResult = await judge0Api.createSubmission({
    source_code: sourceCode,
    language_id: LANGUAGE_IDS.PYTHON_3_8,
    stdin: "10",
  });
  
  if (createResult.isErr()) {
    console.error("Failed to create submission:", createResult.error);
    return null;
  }
  
  const token = createResult.value.token;
  if (!token) {
    console.error("No token received");
    return null;
  }
  
  const result = await pollSubmissionUntilComplete(token);
  
  if (result.isErr()) {
    console.error("Failed to get submission result:", result.error);
    return null;
  }
  
  console.log("Python program output:", result.value.stdout);
  return result.value;
}

/**
 * Execute multiple submissions in batch
 */
export async function executeBatchSubmissions() {
  const submissions = [
    {
      source_code: 'print("Hello from Python")',
      language_id: LANGUAGE_IDS.PYTHON_3_8,
    },
    {
      source_code: 'console.log("Hello from JavaScript");',
      language_id: LANGUAGE_IDS.JAVASCRIPT,
    },
    {
      source_code: 'puts "Hello from Ruby"',
      language_id: LANGUAGE_IDS.RUBY,
    },
  ];
  
  // Create batch submissions
  const createResult = await judge0Api.createSubmissionBatch(submissions);
  
  if (createResult.isErr()) {
    console.error("Failed to create batch submissions:", createResult.error);
    return null;
  }
  
  // Extract tokens from successful submissions
  const tokens = createResult.value
    .filter((result): result is { token: string } => "token" in result)
    .map(result => result.token);
  
  console.log("Created submissions with tokens:", tokens);
  
  // Poll each submission until complete
  const results = await Promise.all(
    tokens.map(token => pollSubmissionUntilComplete(token))
  );
  
  results.forEach((result, index) => {
    if (result.isErr()) {
      console.error(`Submission ${index} failed:`, result.error);
    } else {
      console.log(`Submission ${index} output:`, result.value.stdout?.trim());
    }
  });
  
  return results;
}

/**
 * Test compilation error handling
 */
export async function testCompilationError() {
  const invalidCode = `
#include <stdio.h>

int main() {
    // This will cause a compilation error
    printf("Hello World" // Missing closing quote and semicolon
    return 0;
}
  `.trim();
  
  const createResult = await judge0Api.createSubmission({
    source_code: invalidCode,
    language_id: LANGUAGE_IDS.C_GCC_9_2_0,
  });
  
  if (createResult.isErr()) {
    console.error("Failed to create submission:", createResult.error);
    return null;
  }
  
  const token = createResult.value.token;
  if (!token) {
    console.error("No token received");
    return null;
  }
  
  const result = await pollSubmissionUntilComplete(token);
  
  if (result.isErr()) {
    console.error("Failed to get submission result:", result.error);
    return null;
  }
  
  const submission = result.value;
  console.log("Compilation result:");
  console.log("Status:", submission.status?.description);
  console.log("Compile output:", submission.compile_output);
  
  return submission;
}

/**
 * Test with custom time and memory limits
 */
export async function testWithCustomLimits() {
  const sourceCode = `
#include <stdio.h>
#include <unistd.h>

int main() {
    printf("Starting execution...\\n");
    sleep(1); // Sleep for 1 second
    printf("Execution completed!\\n");
    return 0;
}
  `.trim();
  
  const createResult = await judge0Api.createSubmission({
    source_code: sourceCode,
    language_id: LANGUAGE_IDS.C_GCC_9_2_0,
    cpu_time_limit: 2.0, // 2 seconds
    memory_limit: 64000, // 64MB
  });
  
  if (createResult.isErr()) {
    console.error("Failed to create submission:", createResult.error);
    return null;
  }
  
  const token = createResult.value.token;
  if (!token) {
    console.error("No token received");
    return null;
  }
  
  const result = await pollSubmissionUntilComplete(token);
  
  if (result.isErr()) {
    console.error("Failed to get submission result:", result.error);
    return null;
  }
  
  const submission = result.value;
  console.log("Execution with custom limits:");
  console.log("Status:", submission.status?.description);
  console.log("Output:", submission.stdout);
  console.log("Time:", submission.time, "seconds");
  console.log("Memory:", submission.memory, "KB");
  
  return submission;
}

// ============================================================================
// Utility Functions for Testing
// ============================================================================

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log("=== Judge0 API Examples ===\n");
  
  try {
    console.log("1. Getting available languages...");
    await getAvailableLanguages();
    console.log();
    
    console.log("2. Getting system configuration...");
    await getSystemConfiguration();
    console.log();
    
    console.log("3. Executing Hello World...");
    await executeHelloWorld();
    console.log();
    
    console.log("4. Executing program with input...");
    await executeWithInput();
    console.log();
    
    console.log("5. Executing Python program...");
    await executePythonProgram();
    console.log();
    
    console.log("6. Testing compilation error...");
    await testCompilationError();
    console.log();
    
    console.log("7. Testing with custom limits...");
    await testWithCustomLimits();
    console.log();
    
    console.log("8. Executing batch submissions...");
    await executeBatchSubmissions();
    console.log();
    
    console.log("=== All examples completed! ===");
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

/**
 * Helper function to check if submission is successful
 */
export function isSubmissionSuccessful(submission: any): boolean {
  return submission.status?.id === STATUS_IDS.ACCEPTED;
}

/**
 * Helper function to get human-readable error message
 */
export function getErrorMessage(submission: any): string {
  if (!submission.status) return "Unknown error";
  
  switch (submission.status.id) {
    case STATUS_IDS.COMPILATION_ERROR:
      return `Compilation Error: ${submission.compile_output || "Unknown compilation error"}`;
    case STATUS_IDS.RUNTIME_ERROR_SIGSEGV:
      return "Runtime Error: Segmentation fault";
    case STATUS_IDS.RUNTIME_ERROR_SIGFPE:
      return "Runtime Error: Floating point exception";
    case STATUS_IDS.TIME_LIMIT_EXCEEDED:
      return "Time Limit Exceeded";
    case STATUS_IDS.WRONG_ANSWER:
      return "Wrong Answer";
    case STATUS_IDS.INTERNAL_ERROR:
      return "Internal Error";
    default:
      return submission.status.description || "Unknown error";
  }
}

// Export for use in other modules
export {
  judge0Api,
  LANGUAGE_IDS,
  pollSubmissionUntilComplete,
  STATUS_IDS,
};
