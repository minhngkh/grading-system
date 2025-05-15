import { GradingAttempt, GradingStatus } from "@/types/grading";
import axios, { AxiosRequestConfig } from "axios";
import { Deserializer } from "jsonapi-serializer";

const API_URL = import.meta.env.VITE_ASSIGNMENT_FLOW_URL;

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

export async function createGradingAttempt(): Promise<string> {
  const response = await axios.post(API_URL, null, configHeaders);
  return response.data;
}

export async function getGradingStatus(id: string): Promise<GradingStatus> {
  const response = await axios.get(
    `${API_URL}/${id}?fields[gradings]=status`,
    configHeaders,
  );
  return gradingDeserializer.deserialize(response.data);
}

export async function updateGradingAttempt(
  id: string,
  gradingAttempt: Partial<GradingAttempt>,
): Promise<GradingAttempt> {
  const response = await axios.patch(`${API_URL}/${id}`, gradingAttempt, configHeaders);
  return gradingDeserializer.deserialize(response.data);
}

export async function getGradingAttempt(id: string): Promise<GradingAttempt> {
  const response = await axios.get(`${API_URL}/${id}`, configHeaders);
  return gradingDeserializer.deserialize(response.data);
}

export async function uploadFile(id: string, file: File): Promise<boolean> {
  await axios.post(
    `${API_URL}/${id}/submissions`,
    {
      file: file,
    },
    fileConfigHeaders,
  );

  return true;
}

export async function startGrading(id: string): Promise<boolean> {
  await axios.post(`${API_URL}/${id}/start`, null, fileConfigHeaders);
  return true;
}
