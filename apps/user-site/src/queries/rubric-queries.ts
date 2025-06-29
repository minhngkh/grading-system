import {
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  InfiniteData,
} from "@tanstack/react-query";
import { RubricService } from "@/services/rubric-service";
import { type Rubric } from "@/types/rubric";
import type { GetAllResult, SearchParams } from "@/types/search-params";
import { useAuth } from "@clerk/clerk-react";

type Auth = ReturnType<typeof useAuth>;

export function getInfiniteRubricsQueryOptions(
  auth: Auth,
  baseParams: Partial<SearchParams>,
): (
  params: SearchParams,
) => UseInfiniteQueryOptions<
  GetAllResult<Rubric>,
  unknown,
  InfiniteData<GetAllResult<Rubric>>,
  [string, SearchParams],
  number
> {
  return (params: SearchParams) => ({
    queryKey: ["gradingAttempts", { ...params, ...baseParams }],
    queryFn: async ({ pageParam }) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");

      return RubricService.getRubrics(
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

// Query options for fetching a single rubric by id
export function getRubricQueryOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<Rubric, unknown>>,
): UseQueryOptions<Rubric, unknown> {
  return {
    queryKey: ["rubric", id],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return RubricService.getRubric(id, token);
    },
    enabled: Boolean(id),
    ...options,
  };
}

// Mutation options for creating a rubric
export function createRubricMutationOptions(
  auth: Auth,
  options?: Partial<UseMutationOptions<Rubric, unknown, void>>,
): UseMutationOptions<Rubric, unknown, void> {
  return {
    mutationFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return RubricService.createRubric(token);
    },
    ...options,
  };
}

// Mutation options for updating a rubric
export function updateRubricMutationOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<Rubric, unknown, Partial<Rubric>>>,
): UseMutationOptions<Rubric, unknown, Partial<Rubric>> {
  return {
    mutationFn: async (update: Partial<Rubric>) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return RubricService.updateRubric(id, update, token);
    },
    ...options,
  };
}

// Mutation options for deleting a rubric
export function deleteRubricMutationOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<void, unknown, void>>,
): UseMutationOptions<void, unknown, void> {
  return {
    mutationFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      await RubricService.deleteRubric(id, token);
    },
    ...options,
  };
}

// Mutation options for uploading context files to a rubric
export function uploadContextMutationOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<void, unknown, File[]>>,
): UseMutationOptions<void, unknown, File[]> {
  return {
    mutationFn: async (files) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      await RubricService.uploadContext(id, files, token);
    },
    ...options,
  };
}

// Mutation options for deleting an attachment
export function deleteAttachmentMutationOptions(
  id: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<void, unknown, string>>,
): UseMutationOptions<void, unknown, string> {
  return {
    mutationFn: async (file: string) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      await RubricService.deleteAttachment(id, file, token);
    },
    ...options,
  };
}
