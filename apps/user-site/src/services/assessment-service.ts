import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type {
  Assessment,
  AssessmentState,
  FeedbackItem,
  ScoreAdjustment,
  ScoreBreakdown,
} from "@/types/assessment";
import type { GetAllResult, SearchParams } from "@/types/search-params";
import axios from "axios";
import { Deserializer } from "jsonapi-serializer";
import { buildFilterExpr, eq } from "@/lib/json-api-query";
import { Grader } from "./../types/assessment";

const BASE_URL = import.meta.env.VITE_ASSIGNMENT_FLOW_URL;
const ASSIGNMENT_FLOW_API_URL = `${BASE_URL}/api/v1`;
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
    const feedbacks = (record.feedbacks ?? []).map((fb: any) => {
      let location = {};
      if (fb.locationData) {
        location = fb.locationData;
      } else if (fb.locationDataJson) {
        try {
          location = JSON.parse(fb.locationDataJson);
        } catch {
          location = {};
        }
      }
      // Merge location fields lên cấp cao nhất, loại bỏ locationData và locationDataJson
      const { locationData, locationDataJson, ...rest } = fb;
      return {
        ...rest,
        locationData: location,
      };
    });

    return {
      id: record.id,
      gradingId: record.gradingId,
      submissionReference: record.submissionReference,
      rawScore: record.rawScore,
      adjustedCount: record.adjustedCount,
      scoreBreakdowns: (record.scoreBreakdowns as any) ?? [],
      feedbacks,
      status: record.status,
      lastModified: record.lastModified ? new Date(record.lastModified) : undefined,
      createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
    };
  }

  static async getAssessmentById(id: string, token: string): Promise<Assessment> {
    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(`${ASSESSMENT_API_URL}/${id}`, configHeaders);
    const raw = await this.assessmentDeserializer.deserialize(response.data);
    return this.ConvertToAssessment(raw);
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
    let nextUrl: string | null = `${BASE_URL}/api/v1/assessments?filter=${filter}`;

    while (nextUrl) {
      const response: AxiosResponse = await axios.get(nextUrl, configHeaders);
      const data = await this.assessmentDeserializer.deserialize(response.data);
      allData.push(...data);
      nextUrl =
        response.data.links?.next ? `${BASE_URL}${response.data.links.next}` : null;
    }

    return allData;
  }

  static async updateFeedback(id: string, feedbacks: FeedbackItem[], token: string) {
    const configHeaders = await this.buildHeaders(token);
    const payload = { feedbacks };
    return await axios.put(
      `${ASSESSMENT_API_URL}/${id}/feedbacks`,
      payload,
      configHeaders,
    );
  }

  static async updateScore(
    id: string,
    scoreBreakdowns: Partial<ScoreBreakdown>[],
    token: string,
  ) {
    const configHeaders = await this.buildHeaders(token);
    const payload = { scoreBreakdowns };
    return await axios.post(`${ASSESSMENT_API_URL}/${id}/scores`, payload, configHeaders);
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
  static async getScoreAdjustments(
    assessmentId: string,
    token: string,
  ): Promise<ScoreAdjustment[]> {
    const params = new URLSearchParams();
    const filterExpr = buildFilterExpr([eq("assessment.id", assessmentId)]);
    params.append("filter", filterExpr ?? "");

    const configHeaders = await this.buildHeaders(token);
    const response = await axios.get(
      `${ASSIGNMENT_FLOW_API_URL}/scoreAdjustments?${params.toString()}`,
      configHeaders,
    );

    const data = (await this.assessmentDeserializer.deserialize(response.data)) as any[];

    return data.map((item: any) => {
      return {
        adjustmentSource:
          Grader[item.adjustmentSource as keyof typeof Grader] || Grader.teacher,
        score: item.score,
        createdAt: new Date(item.createdAt),
        scoreBreakdowns: item.scoreBreakdowns,
        deltaScoreBreakdowns: item.deltaScoreBreakdowns,
        deltaScore: item.deltaScore,
      };
    });
  }
}
