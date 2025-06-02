import { PluginListSchema } from "@/types/plugin";
import axios from "axios";

const API_URL = `${import.meta.env.VITE_AI_PLUGIN_URL}/api/v1`;
const PLUGIN_API_URL = `${API_URL}/plugins`;

export class PluginService {
  static async getAll() {
    const response = await axios.get(PLUGIN_API_URL, {
      headers: {
        "Content-Type": "application/vnd.api+json",
      },
    });

    console.log("PluginService.getAll response:", response.data);

    return PluginListSchema.safeParse(response.data);
  }
}
