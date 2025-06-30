import {
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  InfiniteData,
} from "@tanstack/react-query";
import { GradingService } from "@/services/grading-service";
import { GradingAttempt, GradingStatus, CriteriaSelector } from "@/types/grading";
import { GetAllResult, SearchParams } from "@/types/search-params";
import { OverallGradingAnalytics, GradingAnalytics } from "@/types/analytics";
import { useAuth } from "@clerk/clerk-react";

type Auth = ReturnType<typeof useAuth>;

export function getInfiniteGradingAttemptsQueryOptions(
  auth: Auth,
  baseParams: Partial<SearchParams>,
): (
  params: SearchParams,
) => UseInfiniteQueryOptions<
  GetAllResult<GradingAttempt>,
  unknown,
  InfiniteData<GetAllResult<GradingAttempt>>,
  [string, SearchParams],
  number
> {
  return (params: SearchParams) => ({
    queryKey: ["gradingAttempts", { ...params, ...baseParams }],
    queryFn: async ({ pageParam }) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");

      return GradingService.getGradingAttempts(
        {
          ...params,
          ...baseParams,
          page: pageParam,
        },
        token,
      );
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce((sum, page) => sum + page.data.length, 0);
      return totalFetched < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export const getGradingAttemptQueryOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<GradingAttempt>>,
): UseQueryOptions<GradingAttempt> => ({
  queryKey: ["gradingAttempt", id],
  queryFn: async () => {
    const token = await auth.getToken();
    return GradingService.getGradingAttempt(id, token!);
  },
  enabled: Boolean(id),
  ...options,
});

export const getGradingStatusQueryOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<GradingStatus>>,
): UseQueryOptions<GradingStatus> => ({
  queryKey: ["gradingStatus", id],
  queryFn: async () => {
    const token = await auth.getToken();
    return GradingService.getGradingStatus(id, token!);
  },
  ...options,
});

export const getAllGradingsSummaryQueryOptions = (
  auth: Auth,
  options?: Partial<UseQueryOptions<OverallGradingAnalytics>>,
): UseQueryOptions<OverallGradingAnalytics> => ({
  queryKey: ["allGradingsSummary"],
  queryFn: async () => {
    const token = await auth.getToken();
    return GradingService.getAllGradingsSummary(token!);
  },
  ...options,
});

export const getGradingSummaryQueryOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<GradingAnalytics>>,
): UseQueryOptions<GradingAnalytics> => ({
  queryKey: ["gradingSummary", id],
  queryFn: async () => {
    const token = await auth.getToken();
    return GradingService.getGradingSummary(id, token!);
  },
  ...options,
});

export const createGradingAttemptMutationOptions = (
  auth: Auth,
  options?: Partial<UseMutationOptions<GradingAttempt>>,
): UseMutationOptions<GradingAttempt> => ({
  mutationFn: async () => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.createGradingAttempt(token);
  },
  ...options,
});

export const updateGradingRubricMutationOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown, unknown, string>>,
): UseMutationOptions<unknown, unknown, string> => ({
  mutationFn: async (rubricId: string) => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.updateGradingRubric(id, rubricId, token);
  },
  ...options,
});

export const updateGradingScaleFactorMutationOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown, unknown, number>>,
): UseMutationOptions<unknown, unknown, number> => ({
  mutationFn: async (scale: number) => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.updateGradingScaleFactor(id, scale, token);
  },
  ...options,
});

export const updateGradingSelectorsMutationOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown, unknown, CriteriaSelector[]>>,
): UseMutationOptions<unknown, unknown, CriteriaSelector[]> => ({
  mutationFn: async (selectors: CriteriaSelector[]) => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.updateGradingSelectors(id, selectors, token);
  },
  ...options,
});

export const uploadSubmissionMutationOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown, unknown, File>>,
): UseMutationOptions<unknown, unknown, File> => ({
  mutationFn: async (file: File) => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.uploadSubmission(id, file, token);
  },
  ...options,
});

export const startGradingMutationOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown>>,
): UseMutationOptions<unknown> => ({
  mutationFn: async () => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.startGrading(id, token);
  },
  ...options,
});

export const rerunGradingMutationOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown>>,
): UseMutationOptions<unknown> => ({
  mutationFn: async () => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.rerunGrading(id, token);
  },
  ...options,
});

export const deleteSubmissionMutationOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown, unknown, string>>,
): UseMutationOptions<unknown, unknown, string> => ({
  mutationFn: async (reference: string) => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.deleteSubmission(id, reference, token);
  },
  ...options,
});

export const deleteGradingAttemptMutationOptions = (
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown, unknown, string>>,
): UseMutationOptions<unknown, unknown, string> => ({
  mutationFn: async (id: string) => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.deleteGradingAttempt(id, token);
  },
  ...options,
});

export const updateGradingNameMutationOptions = (
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<unknown, unknown, string>>,
): UseMutationOptions<unknown, unknown, string> => ({
  mutationFn: async (name: string) => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.updateGradingName(id, name, token);
  },
  ...options,
});

export const getAssessmentSASTokenQueryOptions = (
  id: string,
  attachment: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<string>>,
): UseQueryOptions<string> => ({
  queryKey: ["assessmentSASToken", id, attachment],
  queryFn: async () => {
    const token = await auth.getToken();
    if (!token) throw new Error("Authentication token is required");
    return GradingService.getAssessmentSASToken(id, attachment, token);
  },
  enabled: Boolean(id && attachment),
  ...options,
});
