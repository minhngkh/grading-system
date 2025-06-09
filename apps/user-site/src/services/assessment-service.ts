import { Assessment } from "@/types/assessment";
import axios, { AxiosRequestConfig } from "axios";
import { Deserializer } from "jsonapi-serializer";

const ASSIGNMENT_FLOW_API_URL = `${import.meta.env.VITE_ASSIGNMENT_FLOW_URL}/api/v1`;
const ASSESSMENT_API_URL = `${ASSIGNMENT_FLOW_API_URL}/assessments`;

export class AssessmentService {
  private static async buildHeaders(token: string): Promise<AxiosRequestConfig> {
    return {
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Bearer ${token}`,
      },
    };
  }

  private static assessmentDeserializer = new Deserializer({
    keyForAttribute: "camelCase",
  });

  static async getAssessmentById(id: string, token: string): Promise<Assessment> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(`${ASSESSMENT_API_URL}/${id}`, configHeaders);
    return this.assessmentDeserializer.deserialize(response.data);
  }

  static async getGradingAssessments(
    gradingId: string,
    token: string,
  ): Promise<Assessment[]> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${ASSESSMENT_API_URL}?filter=equals(gradingId,'${gradingId}')`,
      configHeaders,
    );

    return this.assessmentDeserializer.deserialize(response.data);
  }
}
