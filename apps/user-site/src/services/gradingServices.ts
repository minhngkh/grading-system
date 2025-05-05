import axios, { AxiosRequestConfig } from "axios";
import { GradingAttempt } from "../types/grading";

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

export async function createGradingAttempt(gradingData: GradingAttempt): Promise<string> {
  const response = await axios.post(API_URL, gradingData, configHeaders);
  return response.data;
}

export async function uploadFile(gradingAttemptId: string, file: File): Promise<boolean> {
  await axios.post(
    `${API_URL}/${gradingAttemptId}/submissions`,
    {
      file: file,
    },
    fileConfigHeaders,
  );

  return true;
}
