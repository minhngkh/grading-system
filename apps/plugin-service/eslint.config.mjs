import { combine } from "@antfu/eslint-config";
import baseConfig from "../../eslint.config.mjs";

export default combine(
  baseConfig,
  {
    rules: {
      "eslint-comments/no-unlimited-disable": "off",
      "perfectionist/sort-imports": [
        "error",
        {
          groups: [
            "type",
            ["parent-type", "sibling-type", "index-type", "internal-type"],
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "side-effect",
            "object",
            "unknown",
          ],
          newlinesBetween: "ignore",
          order: "asc",
          type: "natural",
          partitionByNewLine: true,
        },
      ],
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
    },
  },
);
