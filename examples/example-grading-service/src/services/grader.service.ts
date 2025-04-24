import type { Context } from "moleculer";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import {
  GradingStatus,
  type CriterionGradingResult,
  type GradingResult,
  type Rubric,
  type Submission
} from "../types";
import { defineEvent, emitEvent } from "../utils/events";
import {
  defineTypedService
} from "../utils/typed-moleculer";

// Define events using the defineEvent utility
const events = {
  // Incoming events
  submissionReady: defineEvent("submission.ready", {
    submissionId: z.string(),
  }),

  pluginExecutionCompleted: defineEvent("plugin.execution.completed", {
    submissionId: z.string(),
    criterionId: z.string(),
    score: z.number(),
    feedback: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  }),

  aiGradingCompleted: defineEvent("ai.grading.completed", {
    submissionId: z.string(),
    criterionId: z.string(),
    score: z.number(),
    feedback: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  }),

  // Outgoing events
  graderSubmissionFailed: defineEvent("grader.submission.failed", {
    submissionId: z.string(),
    error: z.string(),
  }),

  pluginExecute: defineEvent("plugin.execute", {
    pluginId: z.string(),
    configurationId: z.object({}).passthrough(),
    submissionId: z.string(),
    criterionId: z.string(),
    content: z.string(),
  }),

  aiGrade: defineEvent("ai.grade", {
    submissionId: z.string(),
    criterionId: z.string(),
    rubricId: z.string(),
    content: z.string(),
    criterion: z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      totalCriterionPoints: z.number(),
      pluginBinding: z
        .object({
          pluginId: z.string(),
          configuration: z.object({}).passthrough(),
        })
        .optional(),
    }),
  }),

  assignmentGraded: defineEvent("assignment.graded", {
    submissionId: z.string(),
    gradingResultId: z.string(),
  }),

  submissionStatusUpdate: defineEvent("submission.status.update", {
    submissionId: z.string(),
    status: z.nativeEnum(GradingStatus),
  }),

  submissionBreakdownUpdate: defineEvent("submission.breakdown.update", {
    submissionId: z.string(),
    criterionId: z.string(),
    score: z.object({
      pointsAwarded: z.number(),
      comments: z.string(),
      source: z.enum(["AI", "PLUGIN", "HUMAN"]),
      updatedAt: z.string(),
    }),
  }),
} as const;

export const graderService = defineTypedService({
  name: "grader",

  settings: {
    // Configure service settings
  },

  created() {
    this.logger.info("Grader service created");
  },

  async started() {
    this.logger.info("Grader service started");
  },

  async stopped() {
    this.logger.info("Grader service stopped");
  },

  events: {
    /**
     * Event handler for submission.ready event
     * This event is triggered when a submission is ready to be graded
     */
    [events.submissionReady.name]: {
      params: events.submissionReady.validate.schema,
      async handler(
        ctx: Context<typeof events.submissionReady.validate.context>
      ) {
        const { submissionId } = ctx.params;
        this.logger.info(
          `Received submission.ready event for submission: ${submissionId}`
        );

        try {
          await this.processSubmission(ctx, submissionId);
        } catch (error) {
          this.logger.error(
            `Error processing submission ${submissionId}:`,
            error
          );

          // Emit failure event for tracking
          emitEvent(ctx, events.graderSubmissionFailed, {
            submissionId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      },
    },

    /**
     * Event handler for plugin.execution.completed
     * Triggered when a plugin finishes grading a criterion
     */
    [events.pluginExecutionCompleted.name]: {
      params: events.pluginExecutionCompleted.validate.schema,
      async handler(
        ctx: Context<typeof events.pluginExecutionCompleted.validate.context>
      ) {
        const { submissionId, criterionId, score, feedback, success, error } =
          ctx.params;

        this.logger.info(
          `Received plugin.execution.completed event for submission: ${submissionId}, criterion: ${criterionId}`
        );

        if (!success) {
          this.logger.error(
            `Plugin execution failed for criterion ${criterionId}: ${error}`
          );
          return;
        }

        try {
          await this.updateCriterionScore(
            ctx,
            submissionId,
            criterionId,
            score,
            feedback,
            "PLUGIN"
          );
          await this.checkGradingCompletion(ctx, submissionId);
        } catch (error) {
          this.logger.error(
            `Error updating criterion score from plugin for ${submissionId}:`,
            error
          );
        }
      },
    },

    /**
     * Event handler for ai.grading.completed
     * Triggered when AI service finishes grading a criterion
     */
    [events.aiGradingCompleted.name]: {
      params: events.aiGradingCompleted.validate.schema,
      async handler(
        ctx: Context<typeof events.aiGradingCompleted.validate.context>
      ) {
        const { submissionId, criterionId, score, feedback, success, error } =
          ctx.params;

        this.logger.info(
          `Received ai.grading.completed event for submission: ${submissionId}, criterion: ${criterionId}`
        );

        if (!success) {
          this.logger.error(
            `AI grading failed for criterion ${criterionId}: ${error}`
          );
          return;
        }

        try {
          await this.updateCriterionScore(
            ctx,
            submissionId,
            criterionId,
            score,
            feedback,
            "AI"
          );
          await this.checkGradingCompletion(ctx, submissionId);
        } catch (error) {
          this.logger.error(
            `Error updating criterion score from AI for ${submissionId}:`,
            error
          );
        }
      },
    },
  },

  methods: {
    /**
     * Process a submission for grading
     */
    async processSubmission(ctx: Context, submissionId: string): Promise<void> {
      // Step 1: Retrieve submission and rubric data
      const submission = await this.getSubmission(submissionId);
      const rubric = await this.getRubric(submission.rubricId);

      // Step 2: Create a new grading result
      const gradingResultId = uuidv4();
      const gradingResult: GradingResult = {
        id: gradingResultId,
        submissionId: submissionId,
        rubricId: rubric.rubricId,
        gradingStatus: GradingStatus.PROCESSING,
        criterionResults: [],
      };

      // Store grading result
      await this.saveGradingResult(gradingResult);

      // Update submission status
      await this.updateSubmissionStatus(
        ctx,
        submissionId,
        GradingStatus.PROCESSING
      );

      // Step 3: Process each criterion
      for (const criterion of rubric.criteria) {
        const submissionBreakdown = submission.breakdowns.find(
          (b) => b.criterionId === criterion.id
        );

        if (!submissionBreakdown) {
          this.logger.warn(
            `No submission breakdown found for criterion ${criterion.id}`
          );
          continue;
        }

        // Check if criterion has a plugin binding
        if (criterion.pluginBinding) {
          // Use plugin for grading
          this.logger.info(
            `Using plugin ${criterion.pluginBinding.pluginId} for criterion ${criterion.id}`
          );

          // Emit event to execute plugin
          emitEvent(ctx, events.pluginExecute, {
            pluginId: criterion.pluginBinding.pluginId,
            configurationId: criterion.pluginBinding.configuration,
            submissionId: submissionId,
            criterionId: criterion.id,
            content: submissionBreakdown.processedContent,
          });
        } else {
          // Use AI service for grading
          this.logger.info(`Using AI service for criterion ${criterion.id}`);

          // Emit event to request AI grading
          emitEvent(ctx, events.aiGrade, {
            submissionId: submissionId,
            criterionId: criterion.id,
            rubricId: rubric.rubricId,
            content: submissionBreakdown.processedContent,
            criterion: {
              id: criterion.id,
              title: criterion.title,
              description: criterion.description,
              totalCriterionPoints: criterion.totalCriterionPoints,
              pluginBinding: criterion.pluginBinding
                ? {
                    pluginId: criterion.pluginBinding.pluginId,
                    configuration: criterion.pluginBinding.configuration || {},
                  }
                : undefined,
            },
          });
        }
      }
    },

    /**
     * Update criterion score in the grading result
     */
    async updateCriterionScore(
      ctx: Context,
      submissionId: string,
      criterionId: string,
      score: number,
      feedback: string,
      source: "AI" | "PLUGIN" | "HUMAN"
    ): Promise<void> {
      const gradingResult = await this.getGradingResultBySubmissionId(
        submissionId
      );

      if (!gradingResult) {
        throw new Error(
          `Grading result not found for submission ${submissionId}`
        );
      }

      // Create or update criterion result
      const existingIndex = gradingResult.criterionResults.findIndex(
        (cr) => cr.criterionId === criterionId
      );

      const criterionResult: CriterionGradingResult = {
        id:
          existingIndex >= 0
            ? gradingResult.criterionResults[existingIndex]?.id ?? uuidv4()
            : uuidv4(),
        gradingResultId: gradingResult.id,
        criterionId: criterionId,
        score: score,
        feedback: feedback,
      };

      if (existingIndex >= 0) {
        gradingResult.criterionResults[existingIndex] = criterionResult;
      } else {
        gradingResult.criterionResults.push(criterionResult);
      }

      // Save updated grading result
      await this.saveGradingResult(gradingResult);

      // Also update the score in the submission breakdown
      await this.updateSubmissionBreakdownScore(
        ctx,
        submissionId,
        criterionId,
        score,
        feedback,
        source
      );
    },

    /**
     * Check if grading is complete for a submission
     */
    async checkGradingCompletion(
      ctx: Context,
      submissionId: string
    ): Promise<void> {
      const submission = await this.getSubmission(submissionId);
      const gradingResult = await this.getGradingResultBySubmissionId(
        submissionId
      );
      const rubric = await this.getRubric(submission.rubricId);

      if (!gradingResult) {
        throw new Error(
          `Grading result not found for submission ${submissionId}`
        );
      }

      // Count criteria with results
      const gradedCriteriaCount = gradingResult.criterionResults.length;
      const totalCriteriaCount = rubric.criteria.length;

      this.logger.info(
        `Grading progress for submission ${submissionId}: ${gradedCriteriaCount}/${totalCriteriaCount}`
      );

      // If all criteria have been graded, mark as complete
      if (gradedCriteriaCount >= totalCriteriaCount) {
        // Update grading result status
        gradingResult.gradingStatus = GradingStatus.COMPLETED;
        await this.saveGradingResult(gradingResult);

        // Update submission status
        await this.updateSubmissionStatus(
          ctx,
          submissionId,
          GradingStatus.COMPLETED
        );

        // Emit grading completed event
        emitEvent(ctx, events.assignmentGraded, {
          submissionId: submissionId,
          gradingResultId: gradingResult.id,
        });

        this.logger.info(`Grading completed for submission ${submissionId}`);
      }
    },

    /**
     * Update the status of a submission
     */
    async updateSubmissionStatus(
      ctx: Context,
      submissionId: string,
      status: GradingStatus
    ): Promise<void> {
      // Emit event to update submission status
      emitEvent(ctx, events.submissionStatusUpdate, {
        submissionId,
        status,
      });
    },

    /**
     * Update a score in the submission breakdown
     */
    async updateSubmissionBreakdownScore(
      ctx: Context,
      submissionId: string,
      criterionId: string,
      score: number,
      comments: string,
      source: "AI" | "PLUGIN" | "HUMAN"
    ): Promise<void> {
      // Emit event to update submission breakdown score
      emitEvent(ctx, events.submissionBreakdownUpdate, {
        submissionId,
        criterionId,
        score: {
          pointsAwarded: score,
          comments,
          source,
          updatedAt: new Date().toISOString(),
        },
      });
    },

    /**
     * Mock method to retrieve submission from the submission service
     * In a real implementation, this would use a repository or call another service
     */
    async getSubmission(submissionId: string): Promise<Submission> {
      // This is a mock implementation
      // In a real implementation, you would retrieve this from a database or another service
      this.logger.info(`Retrieving submission: ${submissionId}`);

      // Simulating retrieval delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Return mock data
      return {
        id: submissionId,
        submittedBy: "user-123",
        submissionTimestamp: new Date().toISOString(),
        rubricId: "rubric-123",
        gradingStatus: GradingStatus.PENDING,
        breakdowns: [
          {
            id: "breakdown-1",
            processedContent: "Sample essay content for criterion 1",
            criterionId: "criterion-1",
            adjustmentCount: 0,
          },
          {
            id: "breakdown-2",
            processedContent: "Sample code for criterion 2",
            criterionId: "criterion-2",
            adjustmentCount: 0,
          },
        ],
      } as Submission;
    },

    /**
     * Mock method to retrieve rubric from the rubric service
     * In a real implementation, this would use a repository or call another service
     */
    async getRubric(rubricId: string): Promise<Rubric> {
      // This is a mock implementation
      // In a real implementation, you would retrieve this from a database or another service
      this.logger.info(`Retrieving rubric: ${rubricId}`);

      // Simulating retrieval delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Return mock data
      return {
        rubricId: rubricId,
        name: "Sample Rubric",
        totalRubricPoints: 100,
        criteria: [
          {
            id: "criterion-1",
            title: "Essay Structure",
            description: "Evaluation of overall essay organization",
            totalCriterionPoints: 40,
          },
          {
            id: "criterion-2",
            title: "Code Quality",
            description: "Evaluation of code quality and functionality",
            totalCriterionPoints: 60,
            pluginBinding: {
              pluginId: "code-runner",
              configuration: {
                language: "javascript",
              },
            },
          },
        ],
      } as Rubric;
    },

    /**
     * Mock method to save grading result
     * In a real implementation, this would use a repository
     */
    async saveGradingResult(gradingResult: GradingResult): Promise<void> {
      // This is a mock implementation
      // In a real implementation, you would save this to a database
      this.logger.info(
        `Saving grading result for submission: ${gradingResult.submissionId}`
      );

      // Simulating save delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    },

    /**
     * Mock method to retrieve grading result by submission ID
     * In a real implementation, this would use a repository
     */
    async getGradingResultBySubmissionId(
      submissionId: string
    ): Promise<GradingResult | null> {
      // This is a mock implementation
      // In a real implementation, you would retrieve this from a database
      this.logger.info(
        `Retrieving grading result for submission: ${submissionId}`
      );

      // Simulating retrieval delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Return mock data - could be null if not found
      return {
        id: `result-${submissionId}`,
        submissionId: submissionId,
        rubricId: "rubric-123",
        gradingStatus: GradingStatus.PROCESSING,
        criterionResults: [
          {
            id: "result-1",
            gradingResultId: "result-123",
            criterionId: "criterion-1",
            score: 30,
            feedback: "Good structure",
          },
          {
            id: "result-2",
            gradingResultId: "result-123",
            criterionId: "criterion-2",
            score: 50,
            feedback: "Needs improvement",
          },
        ],
      } as GradingResult;
    },
  },
});
