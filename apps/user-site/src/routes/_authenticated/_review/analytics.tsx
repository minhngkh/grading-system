import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_review/analytics")({
  component: PageComponent,
});

function PageComponent() {
  return (
    <div>
      <h1>Analytics</h1>
      <p>This page is under construction.</p>
      <p>Check back later for updates!</p>
    </div>
  );
}
