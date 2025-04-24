export enum GradingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

export interface Criterion {
  id: string;
  title: string;
  description: string;
  totalCriterionPoints: number;
  pluginBinding?: {
    pluginId: string;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    configuration?: any;
  }
}

export interface Rubric {
  rubricId: string;
  name: string;
  totalRubricPoints: number;
  criteria: Criterion[];
}

export interface Submission {
  id: string;
  submittedBy: string;
  submissionTimestamp: string;
  rubricId: string;
  gradingStatus: GradingStatus;
  breakdowns: SubmissionBreakdown[];
}

export interface SubmissionBreakdown {
  id: string;
  processedContent: string;
  criterionId: string;
  target?: string;
  fileReference?: string;
  adjustmentCount: number;
  score?: ScoreResult;
}

export interface ScoreResult {
  submissionBreakDownId: string;
  pointsAwarded: number;
  comments: string;
  gradedBy: string;
  source: "AI" | "HUMAN" | "PLUGIN";
  updatedAt: string;
}

export interface CriterionGradingResult {
  id: string;
  gradingResultId: string;
  criterionId: string;
  score: number;
  feedback: string;
}

export interface GradingResult {
  id: string;
  submissionId: string;
  rubricId: string;
  gradingStatus: GradingStatus;
  criterionResults: CriterionGradingResult[];
}

// Events
export interface GradeSubmissionEvent {
  submissionId: string;
}

export interface AssignmentGradedEvent {
  submissionId: string;
  gradingResultId: string;
}

export interface PluginExecutionRequest {
  pluginId: string;
  configurationId?: string;
  submissionId: string;
  criterionId: string;
  content: string;
}

export interface PluginExecutionResponse {
  submissionId: string;
  criterionId: string;
  score: number;
  feedback: string;
  success: boolean;
  error?: string;
}

export interface AIServiceRequest {
  submissionId: string;
  criterionId: string;
  rubricId: string;
  content: string;
  criterion: Criterion;
}

export interface AIServiceResponse {
  submissionId: string;
  criterionId: string;
  score: number;
  feedback: string;
  success: boolean;
  error?: string;
}
