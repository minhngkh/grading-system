import { z } from "zod";

export const GradingResultSchema = z.object({
  criterion: z.string(),
  score: z.number(),
  feedback: z.string(),
  fileReference: z.string().url(),
  position: z
    .object({
      fromLine: z.number(),
      fromColumn: z.number().optional(),
      toLine: z.number(),
      toColumn: z.number().optional(),
    })
    .optional(),
});

export const GradingResultsObjSchema = z.object({
  results: z.array(GradingResultSchema),
});

// export const GradingResultSchema = z.object({
//   criterion: z.string(),
//   score: z.number(),
//   feedback: z.array(z.object(
//     {
//       comment: z.string(),
//       fileReference: z.string().url(),
//       position: z
//         .object({
//           fromLine: z.number(),
//           fromColumn: z.number().optional(),
//           toLine: z.number(),
//           toColumn: z.number().optional(),
//         })
//         .optional(),
//     }
//   ))
// });