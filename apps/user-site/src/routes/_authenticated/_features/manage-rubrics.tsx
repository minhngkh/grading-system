import ManageRubricsPage from "@/pages/features/manage-rubrics";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_features/manage-rubrics")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ManageRubricsPage />;
}
