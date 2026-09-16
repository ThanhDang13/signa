import baseConfig from "@signa/configs/eslint-nest";

export default [
  ...baseConfig,
  {
    files: ["**/*.ts"],
    rules: {}
  }
];
