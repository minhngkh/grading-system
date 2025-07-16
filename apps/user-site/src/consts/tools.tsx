import { Tool, ToolType } from "@/types/tool";

export const SystemTools: Tool[] = [
  {
    name: "Create Rubric",
    details: "Features include code completion, debugging tools, and Git integration.",
    types: [ToolType.Rubric, ToolType.AI],
    isFavorite: true,
    navigation: "/rubrics/create",
    preload: false,
    collapseSidebar: true,
  },
  {
    name: "Manage Rubrics",
    details:
      "Includes components, patterns, and guidelines for creating cohesive user interfaces.",
    types: [ToolType.Rubric, ToolType.Review],
    isFavorite: true,
    navigation: "/rubrics/view",
  },
  {
    name: "Grade Assignments",
    details: "Create task lists, set deadlines, and monitor progress on your projects.",
    types: [ToolType.Grading, ToolType.AI],
    isFavorite: false,
    navigation: "/gradings/create",
    preload: false,
    collapseSidebar: true,
  },
  {
    name: "Manage Gradings",
    details:
      "Track and review student submissions, provide feedback, and manage grading criteria.",
    types: [ToolType.Review, ToolType.Grading],
    isFavorite: false,
    navigation: "/gradings/view",
  },
  {
    name: "Analytics Dashboard",
    details: "Interactive charts and reports to help you make data-driven decisions.",
    types: [ToolType.Review],
    isFavorite: false,
    navigation: "/analytics",
  },
];
