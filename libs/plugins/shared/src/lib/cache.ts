import process from "node:process";
import { CustomError } from "@grading-system/utils/error";
import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL!;

export const cache = new Redis(REDIS_URL);

export class CacheError extends CustomError.withTag("CacheError")<void> {}
