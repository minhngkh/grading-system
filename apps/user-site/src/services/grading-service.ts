import { CriteriaSelector, GradingAttempt, GradingStatus } from "@/types/grading";
import axios, { AxiosRequestConfig } from "axios";
import { Deserializer } from "jsonapi-serializer";

const ASSIGNMENT_FLOW_API_URL = `${import.meta.env.VITE_ASSIGNMENT_FLOW_URL}/api/v1`;
const GRADING_API_URL = `${ASSIGNMENT_FLOW_API_URL}/gradings`;

export type GetGradingsResult = {
  data: GradingAttempt[];
  meta: {
    total: number;
  };
};

export class GradingService {
  static configHeaders: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/vnd.api+json",
    },
  };

  static fileConfigHeaders: AxiosRequestConfig = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };

  static gradingDeserializer = new Deserializer({
    keyForAttribute: "camelCase",
  });

  static async createGradingAttempt(): Promise<GradingAttempt> {
    const response = await axios.post(GRADING_API_URL, {}, this.configHeaders);
    return response.data;
  }

  static async getGradingStatus(id: string): Promise<GradingStatus> {
    const response = await axios.get(
      `${GRADING_API_URL}/${id}?fields[gradings]=status`,
      this.configHeaders,
    );

    const data = await this.gradingDeserializer.deserialize(response.data);
    return data.status;
  }

  static async updateGradingRubric(id: string, rubricId: string) {
    return axios.put(`${GRADING_API_URL}/${id}/rubric`, { rubricId }, this.configHeaders);
  }

  static async updateGradingScaleFactor(id: string, scaleFactor: number) {
    return axios.put(
      `${GRADING_API_URL}/${id}/scaleFactor`,
      { scaleFactor },
      this.configHeaders,
    );
  }

  static async updateGradingSelectors(id: string, selectors: CriteriaSelector[]) {
    return await axios.put(
      `${GRADING_API_URL}/${id}/criterionSelectors`,
      { selectors },
      this.configHeaders,
    );
  }

  static async getGradingAttempts(
    page?: number,
    perPage?: number,
    search?: string,
  ): Promise<GetGradingsResult> {
    const params = new URLSearchParams();

    if (page !== undefined) params.append("page[number]", page.toString());
    if (perPage !== undefined) params.append("page[size]", perPage.toString());
    if (search && search.length > 0) params.append("filter", `contains(id,'${search}')`);

    const url = `${GRADING_API_URL}?${params.toString()}`;
    const response = await axios.get(url, this.configHeaders);
    const data = await this.gradingDeserializer.deserialize(response.data);
    const meta = response.data.meta;

    return { data, meta };
  }

  static async getGradingAttempt(id: string): Promise<GradingAttempt> {
    const response = await axios.get(`${GRADING_API_URL}/${id}`, this.configHeaders);
    return this.gradingDeserializer.deserialize(response.data);
  }

  static async uploadSubmission(id: string, file: File) {
    return await axios.post(
      `${GRADING_API_URL}/${id}/submissions`,
      {
        file,
      },
      this.fileConfigHeaders,
    );
  }

  static async startGrading(id: string) {
    return await axios.post(
      `${GRADING_API_URL}/${id}/start`,
      null,
      this.fileConfigHeaders,
    );
  }
}
