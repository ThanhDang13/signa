import nx from "@nx/eslint-plugin";

export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  {
    ignores: ["**/dist", "**/vite.config.*.timestamp*", "**vitest.config.*.timestamp*"]
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"]
            }
          ]
        }
      ]
    }
  },
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx", "apps/**/*.js", "apps/**/*.jsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@signa/*-dsl", "@signa/fetch-runtime", "@signa/error-runtime"],
              importNames: ["*"],
              message:
                "Apps must import through @signa/nest-* adapters, not directly from DSL packages. Example: import from '@signa/nest-error' instead of '@signa/error-dsl'."
            }
          ]
        }
      ]
    }
  },
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
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports"
        }
      ]
    }
  }
];
