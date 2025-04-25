import { combine, react } from "@antfu/eslint-config";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";
import baseConfig from "../../eslint.config.mjs";

export default combine(
  baseConfig,
  react(),
  {
    rules: {
      "import/consistent-type-specifier-style": "off",
      "eslint-comments/no-unlimited-disable": "off",
    },
  },
  {
    files: ["**/*.?([cm])ts", "**/*.?([cm])tsx"],
    rules: {
      "ts/consistent-type-definitions": "off",
    },
  },
  {
    files: ["tsconfig?(.*).json"],
    rules: {
      "jsonc/sort-keys": "off",
    }
  },
  ...pluginQuery.configs["flat/recommended"],
  ...pluginRouter.configs["flat/recommended"],
  {
    // TODO: either linting and move custom components out of ui or apply linting fix for
    // all of the shadcn components
    files: ["src/components/ui/*.tsx"],
    rules: {
      "perfectionist/sort-imports": "off",
      "import/consistent-type-specifier-style": "off",
      "perfectionist/sort-named-imports": "off",
      "perfectionist/sort-named-exports": "off",
      "react-refresh/only-export-components": "off",
      "ts/consistent-type-imports": "off",
      "react/no-context-provider": "off",
      "react/no-use-context": "off",
      "ts/no-use-before-define": "off",
      "react/no-unstable-context-value": "off",
    },
  },
);
