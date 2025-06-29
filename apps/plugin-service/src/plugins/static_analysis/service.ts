import type { Context } from 'moleculer';
import { defineTypedService2 } from '@grading-system/typed-moleculer/service';
import { ZodParams } from 'moleculer-zod-validator';
import { z } from 'zod';
import { analyzeFiles } from './core';
import { AnalysisRequest } from './types';
import { analyzeZipBuffer } from './grade-zip';

const fileSchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(1),
});

const analyzeParams = new ZodParams({
  files: z.array(fileSchema).min(1),
  rules: z.string().optional(),
});

const analyzeZipParams = new ZodParams({
  zip: z.instanceof(Buffer),
});

export const staticAnalysisService = defineTypedService2({
  name: 'static_analysis',
  version: 1,
  actions: {
    analyze: {
      params: analyzeParams.schema,
      async handler(ctx: Context<typeof analyzeParams.context>) {
        const req: AnalysisRequest = {
          files: ctx.params.files,
          rules: ctx.params.rules,
        };
        return analyzeFiles(req);
      },
    },
    analyzeZip: {
      params: analyzeZipParams.schema,
      async handler(ctx: Context<typeof analyzeZipParams.context>) {
        return analyzeZipBuffer(ctx.params.zip);
      },
    },
    test: {
      handler() {
        return 'static_analysis service is running';
      },
    },
  },
});

export type StaticAnalysisService = typeof staticAnalysisService;
