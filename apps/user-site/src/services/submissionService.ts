// import type { AxiosRequestConfig } from "axios";
// import axios from "axios";
// import { Deserializer, Serializer } from "jsonapi-serializer";
// import type { Submission, GradingResult } from "@/types/submission";

// const API_BASE = "https://localhost:7101/api/v1";
// const JSONAPI_HEADERS: AxiosRequestConfig = {
//   headers: { "Content-Type": "application/vnd.api+json" },
// };

// // JSON:API deserializer (convert snake_case to camelCase)
// const jsonApiDeserializer = new Deserializer({ keyForAttribute: "camelCase" });
// /**
//  * Fetch a single submission by ID
//  */
// export async function getSubmission(submissionId: string): Promise<Submission> {
//   const response = await axios.get(
//     `${API_BASE}/submissions/${submissionId}`,
//     JSONAPI_HEADERS,
//   );
//   return (await jsonApiDeserializer.deserialize(response.data)) as Submission;
// }

// /**
//  * Fetch grading result for a submission
//  */
// export async function getGradingResult(submissionId: string): Promise<GradingResult> {
//   const response = await axios.get(
//     `${API_BASE}/grading-results?submissionId=${submissionId}`,
//     JSONAPI_HEADERS,
//   );
//   return (await jsonApiDeserializer.deserialize(response.data)) as GradingResult;
// }

// /**
//  * Update an entire submission with new submission
//  */

// export async function updateSubmission(
//   submissionId: string,
//   updatedFields: Partial<Submission>,
// ): Promise<Submission> {
//   const response = await axios.patch(
//     `${API_BASE}/submissions/${submissionId}`,
//     updatedFields,
//     JSONAPI_HEADERS,
//   );
//   return response.data;
// }

// /**
//  * Update an entire GradingResult with new criterionResults
//  */
// export async function updateGradingResult(
//   gradingResultId: string,
//   updatedFields: Partial<GradingResult>,
// ): Promise<GradingResult> {
//   const response = await axios.patch(
//     `${API_BASE}/grading-results/${gradingResultId}`,
//     updatedFields,
//     JSONAPI_HEADERS,
//   );

//   return response.data;
// }

// /**
//  * Fetch test results for a submission
//  */
// // export async function getTestResult(
// //   submissionId: string
// // ): Promise<TestResult> {
// //   const response = await axios.get(
// //     `${API_BASE}/submissions/${submissionId}/test-result`
// //   );
// //   return response.data as TestResult;
// // }
