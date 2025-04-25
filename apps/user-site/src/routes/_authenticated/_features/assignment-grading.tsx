import UploadAssignmentPage from "@/pages/features/assignment-grading";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/_features/assignment-grading"
)({
  component: UploadAssignmentPage,
});
