import type { LinkProps } from "@tanstack/react-router";
import type { ReactElement } from "react";

export type NavigationData = {
  title: string;
  icon: ReactElement;
  to: LinkProps["to"];
  preload?: LinkProps["preload"];
};
