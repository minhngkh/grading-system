import type { useAuth } from "@clerk/clerk-react";
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import type {
  AIConfig,
  Plugin,
  StaticAnalysisConfig,
  CodeRunnerConfig as TestRunnerConfig,
  TypeCoverageConfig,
} from "@/types/plugin";
import { PluginService } from "@/services/plugin-service";

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

// Type Coverage Config Query Options
export function getTypeCoverageConfigQueryOptions(
  configId: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<TypeCoverageConfig, unknown>>,
): UseQueryOptions<TypeCoverageConfig, unknown> {
  return {
    queryKey: ["plugin", "type-coverage", "config", configId],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.getTypeCoverageConfig(configId, token);
    },
    ...options,
  };
}

export function createTypeCoverageConfigMutationOptions(
  auth: Auth,
  options?: Partial<UseMutationOptions<any, unknown, TypeCoverageConfig>>,
): UseMutationOptions<any, unknown, TypeCoverageConfig> {
  return {
    mutationFn: async (config: TypeCoverageConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.configTypeCoverage(config, token);
    },
    ...options,
  };
}

export function updateTypeCoverageConfigMutationOptions(
  configId: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<any, unknown, TypeCoverageConfig>>,
): UseMutationOptions<any, unknown, TypeCoverageConfig> {
  return {
    mutationFn: async (config: TypeCoverageConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication token is required");
      return PluginService.updateTypeCoverageConfig(configId, config, token);
    },
    ...options,
  };
}

// AI Plugin Query Options
export function getAIConfigQueryOptions(
  configId: string,
  auth: Auth,
  options?: Partial<UseQueryOptions<AIConfig, unknown>>,
): UseQueryOptions<AIConfig, unknown> {
  return {
    queryKey: ["ai-config", configId],
    queryFn: async () => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication required");
      return PluginService.getAIConfig(configId, token);
    },
    ...options,
  };
}

export function createAIConfigMutationOptions(
  auth: Auth,
  options?: Partial<UseMutationOptions<string, Error, AIConfig>>,
): UseMutationOptions<string, Error, AIConfig> {
  return {
    mutationFn: async (config: AIConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication required");
      return PluginService.configAI(config, token);
    },
    ...options,
  };
}

export function updateAIConfigMutationOptions(
  configId: string,
  auth: Auth,
  options?: Partial<UseMutationOptions<string, Error, AIConfig>>,
): UseMutationOptions<string, Error, AIConfig> {
  return {
    mutationFn: async (config: AIConfig) => {
      const token = await auth.getToken();
      if (!token) throw new Error("Authentication required");
      return PluginService.updateAIConfig(configId, config, token);
    },
    ...options,
  };
}
