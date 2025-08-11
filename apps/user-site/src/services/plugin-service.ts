import type { AxiosRequestConfig } from "axios";
import type {
  AIConfig,
  CodeRunnerConfig,
  Plugin,
  StaticAnalysisConfig,
  TypeCoverageConfig} from "@/types/plugin";
import axios from "axios";
import {
  StaticAnalysisPreset,
} from "@/types/plugin";

const API_URL = `${import.meta.env.VITE_PLUGIN_SERVICE_URL}/api/v1/plugins`;

export class PluginService {
  private static async buildHeaders(token: string): Promise<AxiosRequestConfig> {
    return {
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
      },
    };
  }

  static async getAll(token: string): Promise<Plugin[]> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(`${API_URL}`, configHeaders);
    return response.data;
  }

  static async createDefaultConfig(
    pluginType: string,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.post(
      `${API_URL}/${pluginType}/configs`,
      { type: pluginType },
      configHeaders,
    );
    return response.data.id;
  }

  static async configTestRunner(
    config: CodeRunnerConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.post(
      `${API_URL}/test-runner/configs`,
      {
        type: "test-runner",
        ...config,
      },
      configHeaders,
    );
    return response.data.id;
  }

  static async getTestRunnerConfig(
    configId: string,
    token: string,
  ): Promise<CodeRunnerConfig> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${API_URL}/test-runner/configs/${configId}`,
      configHeaders,
    );
    return response.data;
  }

  static async updateTestRunnerConfig(
    configId: string,
    config: CodeRunnerConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.put(
      `${API_URL}/test-runner/configs/${configId}`,
      {
        type: "test-runner",
        ...config,
      },
      configHeaders,
    );
    return response.data.id;
  }

  static async configStaticAnalysis(
    config: StaticAnalysisConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);

    const { preset, ...restConfig } = config;

    const response = await axios.post(
      `${API_URL}/static-analysis/configs`,
      {
        type: "static-analysis",
        preset: {
          type: preset,
        },
        ...restConfig,
      },
      configHeaders,
    );
    return response.data.id;
  }

  static async getStaticAnalysisConfig(
    configId: string,
    token: string,
  ): Promise<StaticAnalysisConfig> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${API_URL}/static-analysis/configs/${configId}`,
      configHeaders,
    );

    const presetType =
      (response.data.preset.type as StaticAnalysisPreset) ||
      StaticAnalysisPreset["Auto Detect"];

    return {
      ...response.data,
      preset: presetType,
    };
  }

  static async updateStaticAnalysisConfig(
    configId: string,
    config: StaticAnalysisConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);

    const { preset, ...restConfig } = config;

    const response = await axios.put(
      `${API_URL}/static-analysis/configs/${configId}`,
      {
        type: "static-analysis",
        preset: {
          type: preset,
        },
        ...restConfig,
      },
      configHeaders,
    );
    return response.data.id;
  }

  static async configTypeCoverage(
    config: TypeCoverageConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);
    
    const { type, ...restConfig } = config;
    
    const response = await axios.post(
      `${API_URL}/type-coverage/configs`,
      {
        type: "type-coverage",
        ...restConfig,
      },
      configHeaders,
    );
    return response.data.id;
  }

  static async getTypeCoverageConfig(
    configId: string,
    token: string,
  ): Promise<TypeCoverageConfig> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${API_URL}/type-coverage/configs/${configId}`,
      configHeaders,
    );
    return response.data;
  }

  static async updateTypeCoverageConfig(
    configId: string,
    config: TypeCoverageConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);
    
    const { type, ...restConfig } = config;
    
    const response = await axios.put(
      `${API_URL}/type-coverage/configs/${configId}`,
      {
        type: "type-coverage",
        ...restConfig,
      },
      configHeaders,
    );
    return response.data.id;
  }

  static async configAI(
    config: AIConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);
    
    const { type, ...restConfig } = config;
    
    const response = await axios.post(
      `${API_URL}/ai/configs`,
      {
        type: "ai",
        ...restConfig,
      },
      configHeaders,
    );
    return response.data.id;
  }

  static async getAIConfig(
    configId: string,
    token: string,
  ): Promise<AIConfig> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${API_URL}/ai/configs/${configId}`,
      configHeaders,
    );
    return response.data;
  }

  static async updateAIConfig(
    configId: string,
    config: AIConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);
    
    const { type, ...restConfig } = config;
    
    const response = await axios.put(
      `${API_URL}/ai/configs/${configId}`,
      {
        type: "ai",
        ...restConfig,
      },
      configHeaders,
    );
    return response.data.id;
  }
}
