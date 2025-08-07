import { CustomError } from "@grading-system/utils/error";
import { Redis } from "@upstash/redis";

export const cache = Redis.fromEnv();

export class CacheError extends CustomError.withTag("CacheError")<void> {}
