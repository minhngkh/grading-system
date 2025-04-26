import type { Rubric } from "@/types/rubric";
import { RubricDataTable } from "./data-table";

interface ManageRubricsPageProps {
  rubrics: Rubric[];
}

export default function ManageRubricsPage({ rubrics }: ManageRubricsPageProps) {
  return <RubricDataTable rubrics={rubrics} />;
}
