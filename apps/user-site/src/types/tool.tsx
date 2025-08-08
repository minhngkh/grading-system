import type { LinkProps } from "@tanstack/react-router";

export enum ToolType {
  Rubric = "Rubric",
  Grading = "Grading",
  Review = "Review",
  AI = "AI Assistant",
}

export type Tool = {
  name: string;
  details: string;
  types: ToolType[];
  isFavorite: boolean;
  navigation: LinkProps["to"];
  preload?: LinkProps["preload"];
  collapseSidebar?: boolean;
};
