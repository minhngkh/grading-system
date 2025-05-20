import { Assessment } from "@/types/assessment";
import { GradingAttempt, GradingStatus } from "@/types/grading";
import axios, { AxiosRequestConfig } from "axios";
import { Deserializer } from "jsonapi-serializer";

const API_URL = import.meta.env.VITE_ASSIGNMENT_FLOW_URL;
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
  const response = await axios.post(GRADING_API_URL, null, configHeaders);
  return response.data;
}

export async function getGradingStatus(id: string): Promise<GradingStatus> {
  const response = await axios.get(
    `${GRADING_API_URL}/${id}?fields[gradings]=status`,
    configHeaders,
  );
  return gradingDeserializer.deserialize(response.data);
}

export async function updateGradingAttempt(
  id: string,
  gradingAttempt: Partial<GradingAttempt>,
): Promise<GradingAttempt> {
  const response = await axios.patch(
    `${GRADING_API_URL}/${id}`,
    gradingAttempt,
    configHeaders,
  );
  return gradingDeserializer.deserialize(response.data);
}

export type GetGradingAttemptsResult = {
  data: GradingAttempt[];
  meta: {
    total: number;
  };
};

export async function getGradingAttempts(
  page?: number,
  perPage?: number,
): Promise<GetGradingAttemptsResult> {
  const params = new URLSearchParams();

  if (page !== undefined) params.append("page[number]", page.toString());
  if (perPage !== undefined) params.append("page[size]", perPage.toString());

  const url = `${GRADING_API_URL}?${params.toString()}`;
  const response = await axios.get(url, configHeaders);
  const data = await gradingDeserializer.deserialize(response.data);
  const meta = response.data.meta;

  return { data, meta };
}

export async function getGradingAttempt(id: string): Promise<GradingAttempt> {
  const response = await axios.get(`${GRADING_API_URL}/${id}`, configHeaders);
  return gradingDeserializer.deserialize(response.data);
}

export async function uploadFile(id: string, file: File): Promise<boolean> {
  await axios.post(
    `${GRADING_API_URL}/${id}/submissions`,
    {
      file: file,
    },
    fileConfigHeaders,
  );

  return true;
}

export async function startGrading(id: string): Promise<boolean> {
  await axios.post(`${GRADING_API_URL}/${id}/start`, null, fileConfigHeaders);
  return true;
}
