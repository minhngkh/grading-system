import type { z, ZodType } from "zod";

export interface LlmClient {
  generate: {
    (prompt: string): Promise<string>;
    <T extends ZodType>(prompt: string, outputStructure: T, outputStructureAlias?: string): Promise<z.infer<T>>;
  }
}

export 