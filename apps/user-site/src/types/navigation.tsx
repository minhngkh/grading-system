import { LinkProps } from "@tanstack/react-router";
import { ReactElement } from "react";

export type NavigationData = {
  title: string;
  icon: ReactElement;
  to: LinkProps["to"];
  isActive?: boolean;
};
