import { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { AssessmentService } from "@/services/assessment-service";
import type {
  Assessment,
  AssessmentState,
  FeedbackItem,
  ScoreBreakdown,
} from "@/types/assessment";
import type { GetAllResult, SearchParams } from "@/types/search-params";

type Auth = ReturnType<typeof useAuth>;

// Query options for fetching an assessment by id
export function getAssessmentQueryOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<Assessment>>,
): UseQueryOptions<Assessment> {
  return {
    queryKey: ["assessment", id],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return AssessmentService.getAssessmentById(id, token);
    },
    enabled: Boolean(id),
    ...options,
  };
}

// Query options for fetching assessments for a grading
export function getGradingAssessmentsQueryOptions(
  gradingId: string,
  searchParams: SearchParams,
  auth: Auth,
  options?: Partial<UseQueryOptions<GetAllResult<Assessment>>>,
): UseQueryOptions<GetAllResult<Assessment>> {
  return {
    queryKey: ["gradingAssessments", gradingId, searchParams],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return AssessmentService.getGradingAssessments(searchParams, gradingId, token);
    },
    ...options,
  };
}

// Query options for fetching all assessments for a grading
export function getAllGradingAssessmentsQueryOptions(
  gradingId: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<Assessment[]>>,
): UseQueryOptions<Assessment[]> {
  return {
    queryKey: ["allGradingAssessments", gradingId],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return AssessmentService.getAllGradingAssessments(gradingId, token);
    },
    ...options,
  };
}

// Query options for fetching assessment status
export function getAssessmentStatusQueryOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<AssessmentState>>,
): UseQueryOptions<AssessmentState> {
  return {
    queryKey: ["assessmentStatus", id],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return AssessmentService.getAssessmentStatus(id, token);
    },
    ...options,
  };
}

// Mutation options for updating feedback
export function updateFeedbackMutationOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<Assessment, unknown, Partial<FeedbackItem>[]>>,
): UseMutationOptions<Assessment, unknown, Partial<FeedbackItem>[]> {
  return {
    mutationFn: async (feedbacks: Partial<FeedbackItem>[]) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return AssessmentService.updateFeedback(id, feedbacks, token);
    },
    ...options,
  };
}

// Mutation options for updating score breakdowns
export function updateScoreMutationOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<Assessment, unknown, Partial<ScoreBreakdown>[]>>,
): UseMutationOptions<Assessment, unknown, Partial<ScoreBreakdown>[]> {
  return {
    mutationFn: async (scoreBreakdowns: Partial<ScoreBreakdown>[]) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return AssessmentService.updateScore(id, scoreBreakdowns, token);
    },
    ...options,
  };
}

// Mutation options for rerunning assessment auto-grading
export function rerunAssessmentMutationOptions(
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown, unknown, string>>,
): UseMutationOptions<unknown, unknown, string> {
  return {
    mutationFn: async (id: string) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return AssessmentService.rerunAssessment(id, token);
    },
    ...options,
  };
}
