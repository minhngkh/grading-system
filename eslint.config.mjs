import antfu from "@antfu/eslint-config";

export default antfu(
  {
    stylistic: false,
    typescript: true,
  },
  {
    rules: {
      "unused-imports/no-unused-vars": "warn",
      "no-console": "off",

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
