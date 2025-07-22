import type { GoJudge } from "./go-judge.d";
import process from "node:process";
import { createHttpClient } from "@/lib/http-client";
import ws from "ws";

const httpClient = createHttpClient({
  baseUrl: process.env.GO_JUDGE_API_URL,
});

// POST /run - Execute a program in the restricted environment
export function runProgram(request: GoJudge.Request) {
  return httpClient
    .post<GoJudge.Request, GoJudge.Result[]>("/run", request)
    .map((value) => value.data);
}

// GET /file - List all cached file id to original name map
export function listFiles() {
  return httpClient.get<GoJudge.Result["files"]>("/file").map((value) => value.data);
}

// // POST /file - Prepare a file in Go Judge (returns fileId)
// export function prepareFile(file: any) {
//   return httpClient.post<GoJudge.F("/file", file);
// }

// GET /file/:fileId - Download file from Go Judge
// export function getFile(fileId: string) {
//   return httpClient.get(`/file/${fileId}`);
// }

// DELETE /file/:fileId - Delete file specified by fileId
export function deleteFile(fileId: string) {
  // DELETE usually returns 204 No Content, so we can use z.any()
  return httpClient.delete<void>(`/file/${fileId}`).map(() => undefined as void);
}

// GET /version - Get build git version and runtime info
// export function getVersion() {
//   return httpClient.get("/version", VersionSchema);
// }

// // GET /config - Get configuration and supported features
// export function getConfig() {
//   return httpClient.get("/config", ConfigSchema);
// }

const ws = new WebSocket(process.env.GO_JUDGE_WS!);
ws.

