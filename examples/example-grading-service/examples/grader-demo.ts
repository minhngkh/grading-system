import { type Context, ServiceBroker } from "moleculer";
import graderService from "../src/services/grader.service";
import { GradingStatus } from "../src/types";
import { z } from "zod";
import { defineEvent, emitEvent } from "../src/utils/events";

// Define events for mock services
const mockEvents = {
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
      pluginBinding: z.object({
        pluginId: z.string(),
        configuration: z.object({}).passthrough(),
      }).optional(),
    }),
  }),

  pluginExecute: defineEvent("plugin.execute", {
    pluginId: z.string(),
    configurationId: z.object({}).passthrough(),
    submissionId: z.string(),
    criterionId: z.string(),
    content: z.string(),
  }),

  submissionReady: defineEvent("submission.ready", {
    submissionId: z.string(),
  }),

  // Add new events for the responses
  aiGradingCompleted: defineEvent("ai.grading.completed", {
    submissionId: z.string(),
    criterionId: z.string(),
    score: z.number(),
    feedback: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  }),

  pluginExecutionCompleted: defineEvent("plugin.execution.completed", {
    submissionId: z.string(),
    criterionId: z.string(),
    score: z.number(),
    feedback: z.string(),
    success: z.boolean(),
    error: z.string().optional(),
  }),
};

// Create a broker
const broker = new ServiceBroker({
  logger: true,
  logLevel: "info",
  nodeID: "demo-node",
  validator: false,
});

// Register GraderService
broker.createService(graderService);

// Create a mock AI service to handle AI grading requests
broker.createService({
  name: "ai",
  events: {
    [mockEvents.aiGrade.name]: {
      params: mockEvents.aiGrade.validate.schema,
      async handler(ctx: Context<typeof mockEvents.aiGrade.validate.context>) {
        const { submissionId, criterionId, content, criterion } = ctx.params;
        
        this.logger.info(`AI service grading submission: ${submissionId}, criterion: ${criterionId} (${criterion.title})`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Use emitEvent instead of direct ctx.emit
        emitEvent(ctx, mockEvents.aiGradingCompleted, {
          submissionId,
          criterionId,
          score: Math.floor(Math.random() * 30) + 70, // Random score between 70-99
          feedback: `The ${criterion.title.toLowerCase()} shows good understanding, but could be improved in some areas.`,
          success: true
        });
      }
    }
  }
});

// Create a mock plugin service to handle plugin execution requests
broker.createService({
  name: "plugin-registry",
  events: {
    [mockEvents.pluginExecute.name]: {
      params: mockEvents.pluginExecute.validate.schema,
      async handler(ctx: Context<typeof mockEvents.pluginExecute.validate.context>) {
        const { pluginId, submissionId, criterionId, content } = ctx.params;
        
        this.logger.info(`Plugin service executing plugin: ${pluginId} for submission: ${submissionId}, criterion: ${criterionId}`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Use emitEvent instead of direct ctx.emit
        emitEvent(ctx, mockEvents.pluginExecutionCompleted, {
          submissionId,
          criterionId,
          score: Math.floor(Math.random() * 20) + 80, // Random score between 80-99
          feedback: "Your code passes 92% of test cases. Good job implementing the algorithms correctly.",
          success: true
        });
      }
    }
  }
});

// Define the event types for the event handlers
const assignmentGradedEvent = defineEvent("assignment.graded", {
  submissionId: z.string(),
  gradingResultId: z.string()
});

const submissionStatusUpdateEvent = defineEvent("submission.status.update", {
  submissionId: z.string(),
  status: z.nativeEnum(GradingStatus)
});

const submissionBreakdownUpdateEvent = defineEvent("submission.breakdown.update", {
  submissionId: z.string(),
  criterionId: z.string(),
  score: z.object({
    pointsAwarded: z.number(),
    comments: z.string(),
    source: z.enum(["AI", "PLUGIN", "HUMAN"]),
    updatedAt: z.string()
  })
});

// Create a test service to simulate submissions and track results
broker.createService({
  name: "test-client",
  events: {
    [assignmentGradedEvent.name]: {
      params: assignmentGradedEvent.validate.schema,
      handler(ctx: Context<typeof assignmentGradedEvent.validate.context>) {
        const { submissionId, gradingResultId } = ctx.params;
        this.logger.info(`✅ Assignment graded: ${submissionId}, result: ${gradingResultId}`);
        
        // After a short delay, exit the application to complete the demo
        setTimeout(() => {
          console.log("\n🎓 Grading workflow demonstration completed successfully!");
          process.exit(0);
        }, 1000);
      }
    },
    [submissionStatusUpdateEvent.name]: {
      params: submissionStatusUpdateEvent.validate.schema,
      handler(ctx: Context<typeof submissionStatusUpdateEvent.validate.context>) {
        const { submissionId, status } = ctx.params;
        this.logger.info(`📊 Submission status update: ${submissionId}, status: ${status}`);
      }
    },
    [submissionBreakdownUpdateEvent.name]: {
      params: submissionBreakdownUpdateEvent.validate.schema,
      handler(ctx: Context<typeof submissionBreakdownUpdateEvent.validate.context>) {
        const { submissionId, criterionId, score } = ctx.params;
        this.logger.info(`📝 Criterion score update: ${submissionId}, criterion: ${criterionId}, score: ${score.pointsAwarded}`);
        this.logger.info(`   Feedback: "${score.comments}"`);
      }
    }
  },
  methods: {
    submitForGrading(submissionId) {
      this.logger.info(`🚀 Submitting assignment for grading: ${submissionId}`);
      emitEvent(this.broker, mockEvents.submissionReady, {
        submissionId
      });
    }
  },
  started() {
    // Simulate a submission after the broker starts
    setTimeout(() => {
      console.log("\n========= STARTING GRADING WORKFLOW DEMONSTRATION =========\n");
      this.submitForGrading(`demo-submission-${Date.now().toString().substr(-6)}`);
    }, 1000);
  }
});

// Start the broker
broker.start()
  .then(() => {
    console.log("🔌 Broker started. GraderService demonstration initializing...");
    console.log("📋 This demonstration will show the complete grading workflow:");
    console.log("   1. Submission is received");
    console.log("   2. GraderService processes criteria (some via AI, some via plugins)");
    console.log("   3. Results are collected and the final grade is assembled");
    console.log("   4. Events are emitted at each step for tracking");
  })
  .catch(err => {
    console.error("Error starting broker:", err);
    process.exit(1);
  });
