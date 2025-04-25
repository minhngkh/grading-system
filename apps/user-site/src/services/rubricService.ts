import type { Rubric } from "@/types/rubric";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { Deserializer } from "jsonapi-serializer";

const configHeaders: AxiosRequestConfig = {
  headers: {
    "Content-Type": "application/vnd.api+json",
  },
};

// const rubricSerializer = new Serializer("rubrics", {
//   attributes: ["name", "performanceTags", "criteria"],
//   criteria: {
//     attributes: ["name", "totalCriterionPoints", "levels"],
//     levels: {
//       attributes: ["performanceTag", "description", "points"],
//     },
//   },
// });

const rubricDeserializer = new Deserializer({
  keyForAttribute: "camelCase",
});

const API_URL = "https://localhost:7101/api/v1/rubrics";

export async function getRubrics(): Promise<Rubric[]> {
  const response = await axios.get(`${API_URL}`, configHeaders);
  return rubricDeserializer.deserialize(response.data);
}

export async function getRubric(id: string): Promise<Rubric> {
  const response = await axios.get(`${API_URL}/${id}`, configHeaders);
  return rubricDeserializer.deserialize(response.data);
}

export async function createRubric(): Promise<string> {
  const response = await axios.post(
    API_URL,
    { name: "New Rubric" },
    configHeaders
  );

  return response.data;
}

export async function updateRubric(
  id: string,
  rubric: Partial<Rubric>
): Promise<Rubric> {
  const response = await axios.patch(
    `${API_URL}/${id}`,
    { ...rubric, name: rubric.rubricName },
    configHeaders
  );
  return response.data;
}

export async function deleteRubric(id: string): Promise<void> {
  await axios.delete(`${API_URL}/${id}`, configHeaders);
}
