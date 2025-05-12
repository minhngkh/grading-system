import ManualGradeListPage from "@/pages/features/manual-grade";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/_features/manual-grade/")({
  component: ManualGradeListPage,
});
