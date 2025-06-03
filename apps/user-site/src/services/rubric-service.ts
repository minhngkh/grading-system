import type { Rubric } from "@/types/rubric";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { Deserializer } from "jsonapi-serializer";

const API_URL = `${import.meta.env.VITE_RUBRIC_ENGINE_URL}/api/v1`;
const RUBRIC_API_URL = `${API_URL}/rubrics`;

export type GetRubricsResult = {
  data: Rubric[];
  meta: {
    total: number;
  };
};

export class RubricService {
  static configHeaders: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/vnd.api+json",
    },
  };

  static rubricDeserializer = new Deserializer({
    keyForAttribute: "camelCase",
    transform: (record: Rubric) => {
      const rubric: Rubric = {
        id: record.id,
        rubricName: record.rubricName,
        tags: record.tags,
        criteria: record.criteria,
        updatedOn: record.updatedOn ? new Date(record.updatedOn) : undefined,
        status: record.status,
      };

      return rubric;
    },
  });

  static async getRubrics(
    page?: number,
    perPage?: number,
    search?: string,
  ): Promise<GetRubricsResult> {
    const params = new URLSearchParams();

    if (page !== undefined) params.append("page[number]", page.toString());
    if (perPage !== undefined) params.append("page[size]", perPage.toString());
    if (search && search.length > 0)
      params.append("filter", `contains(rubricName,'${search}')`);

    const url = `${RUBRIC_API_URL}?${params.toString()}`;
    const response = await axios.get(url, this.configHeaders);
    const data = await this.rubricDeserializer.deserialize(response.data);
    const meta = response.data.meta;

    return { data, meta };
  }

  static async getRubric(id: string): Promise<Rubric> {
    const response = await axios.get(`${RUBRIC_API_URL}/${id}`, this.configHeaders);
    return this.rubricDeserializer.deserialize(response.data);
  }
  static async createRubric(): Promise<string> {
    const response = await axios.post(
      RUBRIC_API_URL,
      { name: "New Rubric" },
      this.configHeaders,
    );
    return response.data;
  }
  static async updateRubric(id: string, rubric: Partial<Rubric>): Promise<Rubric> {
    const response = await axios.patch(
      `${RUBRIC_API_URL}/${id}`,
      {
        name: rubric.rubricName,
        ...rubric,
      },
      this.configHeaders,
    );
    return response.data;
  }
}
