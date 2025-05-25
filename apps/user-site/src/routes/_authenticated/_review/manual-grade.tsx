import ManualAdjustScore from "@/pages/grading/manual-grade";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_review/manual-grade")({
  component: ManualAdjustScore,
});
