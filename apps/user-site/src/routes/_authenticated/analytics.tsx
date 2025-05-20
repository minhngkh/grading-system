import AnalyticsPage from "@/pages/features/analytics";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: PageComponent,
});

function PageComponent() {
  return <AnalyticsPage />;
}
