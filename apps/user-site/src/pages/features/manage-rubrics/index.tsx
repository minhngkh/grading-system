import { Rubric } from "@/types/rubric";
import { RubricDataTable } from "./data-table";

interface ManageRubricsPageProps {
  rubrics: Rubric[];
}

export default function ManageRubricsPage({ rubrics }: ManageRubricsPageProps) {
  return (
    <div className="container flex flex-col h-full p-10">
      <RubricDataTable rubrics={rubrics} />
    </div>
  );
}
