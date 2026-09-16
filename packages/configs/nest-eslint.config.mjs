import baseConfig from "@signa/configs/eslint";

export default [
  ...baseConfig,
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.cts",
      "**/*.mts",
      "**/*.js",
      "**/*.jsx",
      "**/*.cjs",
      "**/*.mjs"
    ],
    // Override or add rules here
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "off",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports"
        }
      ]
    }
  }
];
