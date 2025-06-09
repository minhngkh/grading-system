import { PluginListSchema } from "@/types/plugin";
import axios, { AxiosRequestConfig } from "axios";

const API_URL = `${import.meta.env.VITE_AI_PLUGIN_URL}/api/v1`;
const PLUGIN_API_URL = `${API_URL}/plugins`;

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

  static async getAll(token: string) {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(PLUGIN_API_URL, configHeaders);
    return PluginListSchema.safeParse(response.data);
  }
}
