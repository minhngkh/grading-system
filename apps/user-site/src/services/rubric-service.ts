import { buildFilterExpr, contains, eq } from "@/lib/json-api-query";
import { RubricStatus, type Rubric } from "@/types/rubric";
import { GetAllResult, SearchParams } from "@/types/search-params";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { Deserializer } from "jsonapi-serializer";

const API_URL = `${import.meta.env.VITE_RUBRIC_ENGINE_URL}/api/v1`;
const RUBRIC_API_URL = `${API_URL}/rubrics`;

export class RubricService {
  static async buildHeaders(token: string): Promise<AxiosRequestConfig> {
    return {
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
      },
    };
  }

  private static async buildFileHeaders(token: string): Promise<AxiosRequestConfig> {
    return {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
      },
    };
  }

  private static rubricDeserializer = new Deserializer({
    keyForAttribute: "camelCase",
    transform: (record: any) => this.ConvertToRubric(record),
  });

  private static ConvertToRubric(record: any): Rubric {
    return {
      id: record.id,
      rubricName: record.rubricName,
      tags: record.tags ?? [],
      criteria: record.criteria ?? [],
      updatedOn: record.updatedOn ? new Date(record.updatedOn) : undefined,
      status: record.status,
      attachments: record.attachments ?? [],
    };
  }

  static async getRubrics(
    searchParams: SearchParams,
    token: string,
  ): Promise<GetAllResult<Rubric>> {
    const { page, perPage, search, status } = searchParams;
    const params = new URLSearchParams();
    if (page != undefined) params.append("page[number]", page.toString());
    if (perPage != undefined) params.append("page[size]", perPage.toString());

    const filterExpr = buildFilterExpr([
      search ? contains("id", search) : undefined,
      eq("status", status || RubricStatus.Draft),
    ]);

    if (filterExpr) {
      params.append("filter", filterExpr);
    }

    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${RUBRIC_API_URL}?${params.toString()}`,
      configHeaders,
    );

    const data = await this.rubricDeserializer.deserialize(response.data);
    return { data, meta: response.data.meta };
  }

  static async getRubric(id: string, token: string): Promise<Rubric> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(`${RUBRIC_API_URL}/${id}`, configHeaders);
    return this.rubricDeserializer.deserialize(response.data);
  }

  static async createRubric(token: string): Promise<Rubric> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.post(RUBRIC_API_URL, null, configHeaders);
    return this.ConvertToRubric(response.data);
  }

  static async updateRubric(
    id: string,
    rubric: Partial<Rubric>,
    token: string,
  ): Promise<Rubric> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.patch(`${RUBRIC_API_URL}/${id}`, rubric, configHeaders);
    return this.ConvertToRubric(response.data);
  }

  static async uploadContext(id: string, files: File[], token: string): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const configHeaders = await this.buildFileHeaders(token);
    return await axios.post(`${RUBRIC_API_URL}/${id}/context`, formData, configHeaders);
  }

  static async deleteAttachment(id: string, file: string, token: string) {
    const configHeaders = await this.buildHeaders(token);
    return await axios.delete(
      `${RUBRIC_API_URL}/${id}/attachments/${file}`,
      configHeaders,
    );
  }

  static async deleteRubric(id: string, token: string): Promise<void> {
    const configHeaders = await this.buildHeaders(token);
    return axios.delete(`${RUBRIC_API_URL}/${id}`, configHeaders);
  }
}
