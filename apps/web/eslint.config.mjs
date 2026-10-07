import nx from "@nx/eslint-plugin";
import baseConfig from "@signa/configs/eslint-nest";
import tanstack from "@tanstack/eslint-plugin-query";

export default [
  ...baseConfig,
  ...nx.configs["flat/react"],
  ...tanstack.configs["recommended"],
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    // Override or add rules here
    rules: {}
  }
];
