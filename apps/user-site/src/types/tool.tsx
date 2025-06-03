import type { LinkProps } from "@tanstack/react-router";

// TODO: This is not a type
// https://2ality.com/2025/01/typescript-enum-patterns.html#alternative-to-enum%3A-union-of-string-literal-types
export enum ToolType {
  Rubric = "Rubric",
  Grading = "Grading",
  Review = "Review",
  Assistant = "Assistant",
}

export type Tool = {
  name: string;
  details: string;
  type: ToolType;
  isFavorite: boolean;
  navigation: LinkProps["to"];
  params?: LinkProps["params"];
  preload?: LinkProps["preload"];
};

export interface ToolsFilterProps {
  currentFilter: ToolType | undefined;
  filterFunction?: (type: ToolType | undefined) => void;
}

export const SystemTools: Tool[] = [
  {
    name: "Generate Rubric",
    details: "Features include code completion, debugging tools, and Git integration.",
    type: ToolType.Rubric,
    isFavorite: true,
    navigation: "/rubrics/create",
    preload: false,
  },
  {
    name: "Manage Rubric",
    details:
      "Includes components, patterns, and guidelines for creating cohesive user interfaces.",
    type: ToolType.Rubric,
    isFavorite: true,
    navigation: "/rubrics",
  },
  {
    name: "Grade Assignments",
    details: "Create task lists, set deadlines, and monitor progress on your projects.",
    type: ToolType.Grading,
    isFavorite: false,
    navigation: "/gradings/create",
    preload: false,
  },
  {
    name: "AI Chat",
    details: "Channels, direct messages, and file sharing to keep your team connected.",
    type: ToolType.Assistant,
    isFavorite: false,
    navigation: "/chat",
  },
  {
    name: "Analytics Dashboard",
    details: "Interactive charts and reports to help you make data-driven decisions.",
    type: ToolType.Review,
    isFavorite: false,
    navigation: "/analytics",
  },
];
