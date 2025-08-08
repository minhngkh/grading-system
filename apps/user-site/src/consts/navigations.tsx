import { NavigationData } from "@/types/navigation";
import {
  Home,
  ClipboardPlus,
  Library,
  BookOpenCheck,
  ChartNoAxesCombined,
} from "lucide-react";

export const NavigationItems: NavigationData[] = [
  {
    title: "Home",
    icon: <Home className="size-4" />,
    to: "/home",
  },
  {
    title: "Create Rubric",
    icon: <ClipboardPlus className="size-4" />,
    to: "/rubrics/create",
    preload: false,
  },
  {
    title: "Manage Rubrics",
    icon: <Library className="size-4" />,
    to: "/rubrics/view",
  },
  {
    title: "Grade Assignments",
    icon: <BookOpenCheck className="size-4" />,
    to: "/gradings/create",
    preload: false,
  },
  {
    title: "Manage Gradings",
    icon: <Library className="size-4" />,
    to: "/gradings/view",
  },
  {
    title: "Analytics",
    icon: <ChartNoAxesCombined className="size-4" />,
    to: "/analytics",
  },
];
