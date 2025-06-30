import { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { PluginService } from "@/services/plugin-service";
import { Plugin, CodeRunnerConfig } from "@/types/plugin";
import { useAuth } from "@clerk/clerk-react";

type Auth = ReturnType<typeof useAuth>;

// Query options for getting all plugins
export function getAllPluginsQueryOptions(
  auth: Auth,
  options?: Partial<UseQueryOptions<Plugin[], unknown>>,
): UseQueryOptions<Plugin[], unknown> {
  return {
    queryKey: ["plugins"],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.getAll(token);
    },
    ...options,
  };
}

// Mutation options for creating code runner config
export function createCodeRunnerConfigMutationOptions(
  auth: Auth,
  options?: Partial<UseMutationOptions<any, unknown, CodeRunnerConfig>>,
): UseMutationOptions<any, unknown, CodeRunnerConfig> {
  return {
    mutationFn: async (config: CodeRunnerConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.createCodeRunnerConfig(config, token);
    },
    ...options,
  };
}
