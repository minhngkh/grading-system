import { LinkProps } from "@tanstack/react-router";

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
};

export interface ToolsFilterProps {
  currentFilter: ToolType | undefined;
  filterFunction?: (type: ToolType | undefined) => void;
}
