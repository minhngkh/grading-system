import type { LinkProps } from "@tanstack/react-router";

// TODO: This is not a type
// https://2ality.com/2025/01/typescript-enum-patterns.html#alternative-to-enum%3A-union-of-string-literal-types
export enum ToolType {
  Rubric = "Rubric",
  Management = "Management",
  Grading = "Grading",
  Communication = "Communication",
  Analytics = "Analytics",
}

export type Tool = {
  name: string;
  details: string;
  type: ToolType;
  isFavorite: boolean;
  navigation: LinkProps["to"];
  params?: LinkProps["params"];
  preload?: boolean;
};

export interface ToolsFilterProps {
  currentFilter: ToolType | undefined;
  filterFunction?: (type: ToolType | undefined) => void;
}
