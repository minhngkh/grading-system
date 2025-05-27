import { Assessment } from "@/types/assessment";
import { CriteriaSelector, GradingAttempt, GradingStatus } from "@/types/grading";
import axios, { AxiosRequestConfig } from "axios";
import { Deserializer } from "jsonapi-serializer";

const API_URL = `${import.meta.env.VITE_ASSIGNMENT_FLOW_URL}/api/v1`;
const GRADING_API_URL = `${API_URL}/gradings`;
const ASSESSMENT_API_URL = `${API_URL}/assessments`;

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

  static async getGradingAssessments(id: string): Promise<Assessment[]> {
    const response = await axios.get(
      `${ASSESSMENT_API_URL}?filter=equals(gradingId,'${id}')`,
      this.configHeaders,
    );
    return this.gradingDeserializer.deserialize(response.data);
  }

  static async createGradingAttempt(): Promise<string> {
    const response = await axios.post(GRADING_API_URL, {}, this.configHeaders);
    return response.data;
  }

  static async getGradingStatus(id: string): Promise<GradingStatus> {
    const response = await axios.get(
      `${GRADING_API_URL}/${id}?fields[gradings]=status`,
      this.configHeaders,
    );
    return this.gradingDeserializer.deserialize(response.data);
  }

  static async updateGradingRubric(id: string, rubricId: string) {
    return axios.put(`${GRADING_API_URL}/${id}/rubric`, { rubricId }, this.configHeaders);
  }

  static async updateGradingSelectors(id: string, selectors: CriteriaSelector[]) {
    return await axios.put(
      `${GRADING_API_URL}/${id}/criterionSelectors`,
      { selectors },
      this.configHeaders,
    );
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
