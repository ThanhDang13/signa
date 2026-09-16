import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import baseConfig from "@signa/configs/eslint";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  ...baseConfig,
  {
    files: ["src/**/*.ts"],
    rules: {},
  },
  {
    files: ["src/**/*.spec.ts", "src/**/*.test.ts"],
    env: {
      jest: true,
    },
    rules: {},
  },
];
