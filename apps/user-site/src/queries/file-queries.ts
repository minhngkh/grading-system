import { UseQueryOptions } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { FileService } from "@/services/file-service";
import type { FileItem } from "@/types/file";

type Auth = ReturnType<typeof useAuth>;

// Query options for loading file items from a specific prefix/directory
export function getFileItemsQueryOptions(
  gradingId: string,
  reference: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<FileItem[]>>,
): UseQueryOptions<FileItem[]> {
  return {
    queryKey: ["files", gradingId, reference],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required to access files.");
      return FileService.loadFileItems(`${gradingId}/${reference}`, token);
    },
    enabled: Boolean(reference !== undefined),
    staleTime: Infinity,
    ...options,
  };
}
