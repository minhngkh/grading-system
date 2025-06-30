import { CodeRunnerConfig, Plugin } from "@/types/plugin";
import axios, { AxiosRequestConfig } from "axios";

const API_URL = `${import.meta.env.VITE_PLUGIN_SERVICE_URL}/api/v1`;

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
    const response = await axios.get(`${API_URL}/plugins`, configHeaders);
    return response.data;
  }

  static async configTestRunner(
    config: CodeRunnerConfig,
    token: string,
  ): Promise<string> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.post(
      `${API_URL}/test-runner/config`,
      config,
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
      `${API_URL}/test-runner/config/${configId}`,
      configHeaders,
    );
    return response.data;
  }

  static async getTestRunnerSupportedLanguages(token: string): Promise<string[]> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${API_URL}/test-runner/config/languages`,
      configHeaders,
    );
    return response.data;
  }
}
