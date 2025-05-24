import { Assessment } from "@/types/assessment";
import { CriteriaSelector, GradingAttempt, GradingStatus } from "@/types/grading";
import axios, { AxiosRequestConfig } from "axios";
import { Deserializer } from "jsonapi-serializer";

const API_URL = `${import.meta.env.VITE_ASSIGNMENT_FLOW_URL}/api/v1`;
const GRADING_API_URL = `${API_URL}/gradings`;
const ASSESSMENT_API_URL = `${API_URL}/assessments`;

const configHeaders: AxiosRequestConfig = {
  headers: {
    "Content-Type": "application/vnd.api+json",
  },
};

const fileConfigHeaders: AxiosRequestConfig = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

const gradingDeserializer = new Deserializer({
  keyForAttribute: "camelCase",
});

export async function getGradingAssessments(id: string): Promise<Assessment[]> {
  const response = await axios.get(
    `${ASSESSMENT_API_URL}?filter=equals(gradingId,'${id}')`,
    configHeaders,
  );
  return gradingDeserializer.deserialize(response.data);
}

export async function createGradingAttempt(): Promise<string> {
  const response = await axios.post(GRADING_API_URL, {}, configHeaders);
  return response.data;
}

export async function getGradingStatus(id: string): Promise<GradingStatus> {
  const response = await axios.get(
    `${GRADING_API_URL}/${id}?fields[gradings]=status`,
    configHeaders,
  );
  return gradingDeserializer.deserialize(response.data);
}

export async function updateGradingRubric(id: string, rubricId: string) {
  return axios.put(`${GRADING_API_URL}/${id}/rubric`, { rubricId }, configHeaders);
}

export async function updateGradingSelectors(id: string, selectors: CriteriaSelector[]) {
  return await axios.put(
    `${GRADING_API_URL}/${id}/criterionSelectors`,
    { selectors },
    configHeaders,
  );
}

export async function getGradingAttempt(id: string): Promise<GradingAttempt> {
  const response = await axios.get(`${GRADING_API_URL}/${id}`, configHeaders);
  return gradingDeserializer.deserialize(response.data);
}

export async function uploadSubmission(id: string, file: File) {
  return await axios.post(
    `${GRADING_API_URL}/${id}/submissions`,
    {
      file,
    },
    fileConfigHeaders,
  );
}

export async function startGrading(id: string) {
  return await axios.post(`${GRADING_API_URL}/${id}/start`, null, fileConfigHeaders);
}
