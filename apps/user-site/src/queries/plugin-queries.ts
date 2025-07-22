import { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { PluginService } from "@/services/plugin-service";
import {
  Plugin,
  CodeRunnerConfig as TestRunnerConfig,
  StaticAnalysisConfig,
} from "@/types/plugin";
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

// Mutation options for updating code runner config
export function updateCodeRunnerConfigMutationOptions(
  configId: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<any, unknown, TestRunnerConfig>>,
): UseMutationOptions<any, unknown, TestRunnerConfig> {
  return {
    mutationFn: async (config: TestRunnerConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.updateTestRunnerConfig(configId, config, token);
    },
    ...options,
  };
}

export function getStaticAnalysisConfigQueryOptions(
  configId: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<StaticAnalysisConfig, unknown>>,
): UseQueryOptions<StaticAnalysisConfig, unknown> {
  return {
    queryKey: ["static-analysis-configs", configId],
    queryFn: async () => {
      console.log("Fetching Static Analysis Config for ID:", configId);
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.getStaticAnalysisConfig(configId, token);
    },
    ...options,
  };
}

// Mutation options for creating static analysis config
export function createStaticAnalysisConfigMutationOptions(
  auth: Auth,
  options?: Partial<UseMutationOptions<any, unknown, StaticAnalysisConfig>>,
): UseMutationOptions<any, unknown, StaticAnalysisConfig> {
  return {
    mutationFn: async (config: StaticAnalysisConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.configStaticAnalysis(config, token);
    },
    ...options,
  };
}

// Mutation options for updating static analysis config
export function updateStaticAnalysisConfigMutationOptions(
  configId: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<any, unknown, StaticAnalysisConfig>>,
): UseMutationOptions<any, unknown, StaticAnalysisConfig> {
  return {
    mutationFn: async (config: StaticAnalysisConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.updateStaticAnalysisConfig(configId, config, token);
    },
    ...options,
  };
}
