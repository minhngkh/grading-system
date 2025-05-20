import type { Tool } from "@/types/tool";
import ToolsFilter from "@/pages/home/tool-filter";
import { ToolsList } from "@/pages/home/tool-list";
import { ToolType } from "@/types/tool";
import { useState } from "react";

const tools: Tool[] = [
  {
    name: "Generate Rubric",
    details: "Features include code completion, debugging tools, and Git integration.",
    type: ToolType.Rubric,
    isFavorite: true,
    navigation: "/rubric-generation",
    preload: false,
  },
  {
    name: "Manage Rubric",
    details:
      "Includes components, patterns, and guidelines for creating cohesive user interfaces.",
    type: ToolType.Management,
    isFavorite: true,
    navigation: "/manage-rubrics",
  },
  {
    name: "Manage Grading",
    details:
      "Includes components, patterns, and guidelines for creating cohesive user interfaces.",
    type: ToolType.Management,
    isFavorite: true,
    navigation: "/manage-grading",
  },
  {
    name: "Grade Assignments",
    details: "Create task lists, set deadlines, and monitor progress on your projects.",
    type: ToolType.Grading,
    isFavorite: false,
    navigation: "/assignment-grading",
    preload: false,
  },
  {
    name: "Manual Grading",
    details: "Manually adjusting score based on rubric criteria.",
    type: ToolType.Grading,
    isFavorite: true,
    navigation: "/manual-grade",
  },
  {
    name: "AI Chat",
    details: "Channels, direct messages, and file sharing to keep your team connected.",
    type: ToolType.Communication,
    isFavorite: false,
    navigation: "/",
  },
  {
    name: "Analytics Dashboard",
    details: "Interactive charts and reports to help you make data-driven decisions.",
    type: ToolType.Analytics,
    isFavorite: false,
    navigation: "/",
  },
];

export default function HomePage() {
  const [filter, setFilter] = useState<ToolType | undefined>();

  const handleFilter = (type: ToolType | undefined) => {
    setFilter(type === filter ? undefined : type);
  };

  return (
    <div className="container p-10 space-y-10">
      <section className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Features</h2>
          <ToolsFilter currentFilter={filter} filterFunction={handleFilter} />
        </div>
        <ToolsList tools={tools.filter((tool) => !filter || tool.type === filter)} />
      </section>
    </div>
  );
}
