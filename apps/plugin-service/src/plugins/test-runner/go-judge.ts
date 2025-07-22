import type { Buffer } from "node:buffer";
import type { GoJudge } from "./go-judge-api";
import process from "node:process";
import { createHttpClient } from "@/lib/http-client";

const httpClient = createHttpClient({
  baseUrl: process.env.GO_JUDGE_API_URL,
});

const SELF_URL = process.env.PLUGIN_SERVICE_URL;

// POST /run - Execute a program in the restricted environment
export function runProgram(
  request: GoJudge.Request,
  callback?: {
    type: string;
    id: string;
  },
) {
  let runUrl = "run";
  if (callback) {
    runUrl += `?callback=${encodeURIComponent(`${SELF_URL}/api/v1/plugins/test-runner/callback?type=${callback.type}&id=${callback.id}`)}`;
  }

  return httpClient
    .post<GoJudge.Request, GoJudge.Result[]>(runUrl, request)
    .map((value) => value.data);
}

// GET /file - List all cached file id to original name map
// export function listFiles() {
//   return httpClient.get<GoJudge.Result["files"]>("file").map((value) => value.data);
// }

// POST /file - Prepare a file in Go Judge (returns fileId)
export function prepareFile(file: Buffer) {
  const form = new FormData();
  form.append("file", new File([file], "file"));

  return httpClient.post<FormData, string>("file", form);
}

// GET /file/:fileId - Download file from Go Judge
// export function getFile(fileId: string) {
//   return httpClient.get(`/file/${fileId}`);
// }

// DELETE /file/:fileId - Delete file specified by fileId
export function deleteFile(fileId: string) {
  // DELETE usually returns 204 No Content, so we can use z.any()
  return httpClient.delete<void>(`/file/${fileId}`).map(() => undefined as void);
}
