import { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { PluginService } from "@/services/plugin-service";
import { Plugin, CodeRunnerConfig as TestRunnerConfig } from "@/types/plugin";
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

export function getTestRunnerConfigQueryOptions(
  configId: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<TestRunnerConfig, unknown>>,
): UseQueryOptions<TestRunnerConfig, unknown> {
  return {
    queryKey: ["configs", configId],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.getTestRunnerConfig(configId, token);
    },
    ...options,
  };
}

// Mutation options for creating code runner config
export function createCodeRunnerConfigMutationOptions(
  auth: Auth,
  options?: Partial<UseMutationOptions<any, unknown, TestRunnerConfig>>,
): UseMutationOptions<any, unknown, TestRunnerConfig> {
  return {
    mutationFn: async (config: TestRunnerConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.configTestRunner(config, token);
    },
    ...options,
  };
}

export function getTestRunnerSupportedLanguagesQueryOptions(
  auth: Auth,
  options?: Partial<UseQueryOptions<string[], unknown>>,
): UseQueryOptions<string[], unknown> {
  return {
    queryKey: ["test-runner", "languages"],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.getTestRunnerSupportedLanguages(token);
    },
    ...options,
  };
}
