import AnalyticsPage from "@/pages/review";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_review/analytics")({
  component: PageComponent,
});

function PageComponent() {
  return <AnalyticsPage />;
}
