import { Assessment } from "@/types/assessment";
import axios, { AxiosRequestConfig } from "axios";
import { Deserializer } from "jsonapi-serializer";

const ASSIGNMENT_FLOW_API_URL = `${import.meta.env.VITE_ASSIGNMENT_FLOW_URL}/api/v1`;
const ASSESSMENT_API_URL = `${ASSIGNMENT_FLOW_API_URL}/assessments`;

export class AssessmentService {
  static configHeaders: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/vnd.api+json",
    },
  };

  static assessmentDeserializer = new Deserializer({
    keyForAttribute: "camelCase",
  });

  static async getAssessmentById(id: string): Promise<Assessment> {
    const response = await axios.get(`${ASSESSMENT_API_URL}/${id}`, this.configHeaders);
    return this.assessmentDeserializer.deserialize(response.data);
  }

  static async getGradingAssessments(gradingId: string): Promise<Assessment[]> {
    const response = await axios.get(
      `${ASSESSMENT_API_URL}?filter=equals(gradingId,'${gradingId}')`,
      this.configHeaders,
    );
    return this.assessmentDeserializer.deserialize(response.data);
  }
}
