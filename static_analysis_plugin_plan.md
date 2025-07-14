# Step-by-Step Plan: Build `static_analysis` Plugin Using Semgrep (Multi-language Support)

## 1. Create Directory Structure
- Create a new directory: `apps/plugin-service/src/plugins/static_analysis/`
- Inside, create these files:
  - `service.ts` — Moleculer service definition for static analysis.
  - `core.ts` — Core logic for running Semgrep and processing results.
  - `core.test.ts` — Unit tests for the core logic.
  - `types.ts` — Type definitions for analysis requests and results.

## 2. Add Semgrep Dependency
- Add Semgrep as a devDependency in the root `package.json`:
  - Run: `npm install --save-dev semgrep` or `pnpm add -D semgrep`
- (Optional) Add a note in the documentation for global Semgrep CLI installation if needed.

## 3. Implement Types
- In `types.ts`, define types for:
  - Analysis request (files: array of {filename, content}, optional rules/config)
  - Semgrep finding/result (rule id, message, location, severity, etc.)
  - Detected language (string, e.g., 'python', 'javascript', etc.)
  - Analysis response (score, list of findings, summary, errors, detected language)

## 4. Implement Core Logic
- In `core.ts`:
  - Write a function to accept multiple files (filename + content) and (optionally) custom rules/config.
  - Detect the language of each file (by extension or content heuristics).
  - For each file:
    - Use Node.js `child_process` to invoke Semgrep CLI with the file (write content to a temp file if needed).
    - Use Semgrep's language support to run the correct analysis.
    - Parse Semgrep's JSON output and map it to your defined types.
    - Calculate a score based on findings (define a scoring algorithm, e.g., fewer findings = higher score).
  - Aggregate results for all files and return a combined response.
  - Handle errors and edge cases (e.g., Semgrep not installed, unsupported language, invalid rules).

## 5. Implement Moleculer Service
- In `service.ts`:
  - Use `defineTypedService2` (like the AI plugin) to define a Moleculer service named `static_analysis`.
  - Expose actions:
    - `analyze`: Accepts an array of files (filename + content), runs detection and grading, returns score, findings, and detected language for each file.
    - `test`: Returns a simple string to verify the service is running.
  - Validate input using Zod schemas (ensure files are present and valid).

## 6. Register the Service
- In `apps/plugin-service/src/index.ts`:
  - Import and register the new `static_analysisService` (like `aiService`).

## 7. Write Unit and Integration Tests
- In `core.test.ts`:
  - Write tests for the core logic (mock Semgrep output for unit tests, test language detection, scoring, and error handling).
  - Add integration tests for the Moleculer service actions (multi-language scenarios).

## 8. Document Usage
- Add a section to the project documentation or a new markdown file:
  - How to use the plugin (API, example requests, expected responses for multiple languages).
  - How to configure custom Semgrep rules.
  - How language detection works and which languages are supported.
  - Troubleshooting tips (e.g., Semgrep installation issues, unsupported languages).

## 9. (Optional) Integrate with Plugin Registry
- If your system has a central plugin registry, register the new plugin for orchestration and discoverability.

---

**Service Flow:**
1. Receive files via API (each with filename and content).
2. Detect the language of each file.
3. Grade each file using Semgrep (with language-specific rules).
4. Calculate and return a score and detailed result for each file (including findings and detected language).

**You can now follow these steps to build and integrate the multi-language `static_analysis` plugin using Semgrep!** 