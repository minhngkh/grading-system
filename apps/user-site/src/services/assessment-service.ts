import { eq } from "@/lib/json-api-query";
import {
  Assessment,
  AssessmentState,
  FeedbackItem,
  ScoreBreakdown,
} from "@/types/assessment";
import { GetAllResult, SearchParams } from "@/types/search-params";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
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

  private static ConvertToAssessment(record: any): Assessment {
    return {
      id: record.id,
      gradingId: record.gradingId,
      submissionReference: record.submissionReference ?? [],
      rawScore: record.rawScore,
      adjustedCount: record.adjustedCount,
      scoreBreakdowns: record.scoreBreakdowns ?? [],
      feedbacks: record.feedbacks ?? [],
      status: record.status,
    };
  }

  static async getAssessmentById(id: string, token: string): Promise<Assessment> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(`${ASSESSMENT_API_URL}/${id}`, configHeaders);
    return this.assessmentDeserializer.deserialize(response.data);
  }

  static async getGradingAssessments(
    params: SearchParams,
    gradingId: string,
    token: string,
  ): Promise<GetAllResult<Assessment>> {
    const { page, perPage } = params;

    const configHeaders = await this.buildHeaders(token);
    const filter = eq("gradingId", gradingId);
    const response = await axios.get(
      `${ASSESSMENT_API_URL}?filter=${filter}&page[number]=${page}&page[size]=${perPage}`,
      configHeaders,
    );

    const data = await this.assessmentDeserializer.deserialize(response.data);
    return { data, meta: response.data.meta };
  }

  static async getAllGradingAssessments(
    gradingId: string,
    token: string,
  ): Promise<Assessment[]> {
    let allData: Assessment[] = [];

    const filter = eq("gradingId", gradingId);
    const configHeaders = await this.buildHeaders(token);
    let nextUrl: string | null = `${ASSESSMENT_API_URL}?filter=${filter}`;

    while (nextUrl) {
      const response: AxiosResponse = await axios.get(nextUrl, configHeaders);
      const data = await this.assessmentDeserializer.deserialize(response.data);
      allData.push(...data);
      nextUrl = data.links?.next ?? null;
    }

    return allData;
  }

  static async updateFeedback(
    id: string,
    feedbacks: Partial<FeedbackItem>[],
    token: string,
  ): Promise<Assessment> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.put(
      `${ASSESSMENT_API_URL}/${id}/feedbacks`,
      // { feedbacks: feedbacks },
      feedbacks,
      configHeaders,
    );
    return this.ConvertToAssessment(response.data);
  }

  static async updateScore(
    id: string,
    scoreBreakdowns: Partial<ScoreBreakdown>[],
    token: string,
  ): Promise<Assessment> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.post(
      `${ASSESSMENT_API_URL}/${id}/scores`,
      { scoreBreakdowns: scoreBreakdowns },
      configHeaders,
    );
    console.log("Score update response:", response.data);
    return this.ConvertToAssessment(response.data);
  }

  static async rerunAssessment(id: string, token: string) {
    const configHeaders = await this.buildHeaders(token);
    return await axios.post(
      `${ASSESSMENT_API_URL}/${id}/startAutoGrading`,
      null,
      configHeaders,
    );
  }

  static async getAssessmentStatus(id: string, token: string): Promise<AssessmentState> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${ASSESSMENT_API_URL}/${id}?fields[gradings]=status`,
      configHeaders,
    );

    const assessment = await this.assessmentDeserializer.deserialize(response.data);
    return assessment.status;
  }
}
