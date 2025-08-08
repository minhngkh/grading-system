import { Tool, ToolType } from "@/types/tool";

export const SystemTools: Tool[] = [
  {
    name: "Create Rubric",
    details: "Design and generate rubrics for grading assessments with AI assistance.",
    types: [ToolType.Rubric, ToolType.AI],
    isFavorite: true,
    navigation: "/rubrics/create",
    preload: false,
    collapseSidebar: true,
  },
  {
    name: "Manage Rubrics",
    details: "View, edit, and manage existing rubrics for grading and assessment.",
    types: [ToolType.Rubric, ToolType.Review],
    isFavorite: true,
    navigation: "/rubrics/view",
  },
  {
    name: "Grade Assignments",
    details: "Grade student assignments using predefined rubrics and provide feedback.",
    types: [ToolType.Grading, ToolType.AI],
    isFavorite: false,
    navigation: "/gradings/create",
    preload: false,
    collapseSidebar: true,
  },
  {
    name: "Manage Gradings",
    details: "View and manage graded assignments, including feedback and scores.",
    types: [ToolType.Review, ToolType.Grading],
    isFavorite: false,
    navigation: "/gradings/view",
  },
  {
    name: "Analytics Dashboard",
    details: "Analyze grading patterns, student performance, and rubric effectiveness.",
    types: [ToolType.Review],
    isFavorite: false,
    navigation: "/analytics",
  },
];
