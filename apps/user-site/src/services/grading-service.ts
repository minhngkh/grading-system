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
  private static async buildHeaders(token: string): Promise<AxiosRequestConfig> {
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

  private static gradingDeserializer = new Deserializer({
    keyForAttribute: "camelCase",
  });

  static async createGradingAttempt(token: string): Promise<GradingAttempt> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.post(GRADING_API_URL, {}, configHeaders);
    return response.data;
  }

  static async getGradingStatus(id: string, token: string): Promise<GradingStatus> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${GRADING_API_URL}/${id}?fields[gradings]=status`,
      configHeaders,
    );

    const data = await this.gradingDeserializer.deserialize(response.data);
    return data.status;
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
    const configHeaders = await this.buildHeaders(token);
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
    const { page, perPage, search } = searchParams;
    const params = new URLSearchParams();

    if (page !== undefined) params.append("page[number]", page.toString());
    if (perPage !== undefined) params.append("page[size]", perPage.toString());
    if (search && search.length > 0) params.append("filter", `contains(id,'${search}')`);

    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${GRADING_API_URL}?${params.toString()}`,
      configHeaders,
    );

    const data = await this.gradingDeserializer.deserialize(response.data);
    return { data, meta: response.data.meta };
  }

  static async getGradingAttempt(id: string, token: string): Promise<GradingAttempt> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(`${GRADING_API_URL}/${id}`, configHeaders);
    return this.gradingDeserializer.deserialize(response.data);
  }

  static async uploadSubmission(
    id: string,
    file: File,
    token: string,
  ): Promise<Submission> {
    const configHeaders = await this.buildFileHeaders(token);
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
    const configHeaders = await this.buildHeaders(token);
    return await axios.post(`${GRADING_API_URL}/${id}/start`, null, configHeaders);
  }

  static async deleteSubmission(id: string, reference: string, token: string) {
    const configHeaders = await this.buildHeaders(token);
    return await axios.delete(
      `${GRADING_API_URL}/${id}/submissions/${reference}`,
      configHeaders,
    );
  }
}
