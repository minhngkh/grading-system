import ToolsFilter from "@/pages/home/tool-filter";
import { ToolsList } from "@/pages/home/tool-list";
import { SystemTools, ToolType } from "@/types/tool";
import { useState } from "react";

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
        <ToolsList
          tools={SystemTools.filter((tool) => !filter || tool.types.includes(filter))}
        />
      </section>
    </div>
  );
}
