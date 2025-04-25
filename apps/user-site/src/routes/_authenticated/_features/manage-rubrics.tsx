import ManageRubricsPage from "@/pages/features/manage-rubrics";
import { getRubrics } from "@/services/rubricService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/_features/manage-rubrics"
)({
  component: RouteComponent,
  loader: async () => {
    try {
      return await getRubrics();
    } catch (err) {
      console.log(err);
      return [];
    }
  },
  pendingComponent: () => PendingComponent(),
});

function PendingComponent() {
  return (
    <div className="container flex size-full justify-center items-center">
      Retrieving Rubrics...
    </div>
  );
}

function RouteComponent() {
  const rubrics = Route.useLoaderData();
  return <ManageRubricsPage rubrics={rubrics} />;
}
