import { buildFilterExpr, contains, eq } from "@/lib/json-api-query";
import { GradingAnalytics, OverallGradingAnalytics } from "@/types/analytics";
import {
  CriteriaSelector,
  GradingAttempt,
  GradingStatus,
  Submission,
} from "@/types/grading";
import { GetAllResult, SearchParams } from "@/types/search-params";
import axios, { AxiosRequestConfig } from "axios";
import { Deserializer } from "jsonapi-serializer";

const ASSIGNMENT_FLOW_API_URL = `${import.meta.env.VITE_ASSIGNMENT_FLOW_URL}/api/v1`;
const GRADING_API_URL = `${ASSIGNMENT_FLOW_API_URL}/gradings`;

export class GradingService {
  private static buildHeaders(token: string): AxiosRequestConfig {
    return {
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
      },
    };
  }

  private static buildFileHeaders(token: string): AxiosRequestConfig {
    return {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
      },
    };
  }

  private static ConvertToGrading(record: any): GradingAttempt {
    return {
      ...record,
      rubricId: !record.rubricId ? undefined : record.rubricId,
      lastModified: record.lastModified ? new Date(record.lastModified) : undefined,
      scaleFactor: !record.scaleFactor ? 10 : record.scaleFactor,
    };
  }

  private static gradingDeserializer = new Deserializer({
    keyForAttribute: "camelCase",
    transform: (record: any) => this.ConvertToGrading(record),
  });

  static async createGradingAttempt(token: string): Promise<GradingAttempt> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.post(GRADING_API_URL, {}, configHeaders);
    return this.ConvertToGrading(response.data);
  }

  static async getGradingStatus(id: string, token: string): Promise<GradingStatus> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${GRADING_API_URL}/${id}?fields[gradings]=status`,
      configHeaders,
    );

    const grading = await this.gradingDeserializer.deserialize(response.data);
    return grading.status;
  }

  static async updateGradingRubric(id: string, rubricId: string, token: string) {
    const configHeaders = await this.buildHeaders(token);
    return axios.put(`${GRADING_API_URL}/${id}/rubric`, { rubricId }, configHeaders);
  }

  static async updateGradingScaleFactor(id: string, scaleFactor: number, token: string) {
    const configHeaders = await this.buildHeaders(token);
    return axios.put(
      `${GRADING_API_URL}/${id}/scaleFactor`,
      { scaleFactor },
      configHeaders,
    );
  }

  static async updateGradingSelectors(
    id: string,
    selectors: CriteriaSelector[],
    token: string,
  ) {
    const configHeaders = this.buildHeaders(token);
    return await axios.put(
      `${GRADING_API_URL}/${id}/criterionSelectors`,
      { selectors },
      configHeaders,
    );
  }

  static async getGradingAttempts(
    searchParams: SearchParams,
    token: string,
  ): Promise<GetAllResult<GradingAttempt>> {
    const { page, perPage, search, status } = searchParams;
    const params = new URLSearchParams();

    if (page != undefined) params.append("page[number]", page.toString());
    if (perPage != undefined) params.append("page[size]", perPage.toString());

    const filterExpr = buildFilterExpr([
      search ? contains("name", search) : undefined,
      status ? eq("status", status) : undefined,
    ]);

    if (filterExpr) {
      params.append("filter", filterExpr);
    }

    const configHeaders = this.buildHeaders(token);
    const response = await axios.get(
      `${GRADING_API_URL}?${params.toString()}`,
      configHeaders,
    );

    const data = await this.gradingDeserializer.deserialize(response.data);
    return { data, meta: response.data.meta };
  }

  static async getGradingAttempt(id: string, token: string): Promise<GradingAttempt> {
    const configHeaders = this.buildHeaders(token);
    const response = await axios.get(`${GRADING_API_URL}/${id}`, configHeaders);
    return this.gradingDeserializer.deserialize(response.data);
  }

  static async uploadSubmission(
    id: string,
    file: File,
    token: string,
  ): Promise<Submission> {
    const configHeaders = this.buildFileHeaders(token);
    const response = await axios.post(
      `${GRADING_API_URL}/${id}/submissions`,
      {
        file,
      },
      configHeaders,
    );

    return { reference: response.data };
  }

  static async startGrading(id: string, token: string) {
    const configHeaders = this.buildHeaders(token);
    return await axios.post(`${GRADING_API_URL}/${id}/start`, null, configHeaders);
  }

  static async rerunGrading(id: string, token: string) {
    const configHeaders = this.buildHeaders(token);
    return await axios.post(`${GRADING_API_URL}/${id}/restart`, null, configHeaders);
  }

  static async deleteSubmission(id: string, reference: string, token: string) {
    const configHeaders = this.buildHeaders(token);
    return await axios.delete(
      `${GRADING_API_URL}/${id}/submissions/${reference}`,
      configHeaders,
    );
  }

  static async getAllGradingsSummary(token: string): Promise<OverallGradingAnalytics> {
    const configHeaders = this.buildHeaders(token);
    const response = await axios.get(`${GRADING_API_URL}/summary`, configHeaders);
    return response.data;
  }

  static async getGradingSummary(id: string, token: string): Promise<GradingAnalytics> {
    const configHeaders = this.buildHeaders(token);
    const response = await axios.get(`${GRADING_API_URL}/${id}/summary`, configHeaders);
    return response.data;
  }

  static async deleteGradingAttempt(id: string, token: string): Promise<void> {
    const configHeaders = this.buildHeaders(token);
    return axios.delete(`${GRADING_API_URL}/${id}`, configHeaders);
  }

  static async updateGradingName(id: string, name: string, token: string): Promise<void> {
    const configHeaders = this.buildHeaders(token);
    return axios.put(`${GRADING_API_URL}/${id}/name`, { name }, configHeaders);
  }
}
