import { CodeRunnerConfig, PluginListSchema } from "@/types/plugin";
import axios, { AxiosRequestConfig } from "axios";

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

  static async createCodeRunnerConfig(config: CodeRunnerConfig, token: string) {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.post(
      `${API_URL}/code-runner/config`,
      config,
      configHeaders,
    );
    return response.data;
  }

  static async getAll(token: string) {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(API_URL, configHeaders);
    return PluginListSchema.safeParse(response.data);
  }
}
