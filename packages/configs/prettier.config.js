/** @type {import('prettier').Config} */
const prettierConfig = {
  semi: true,
  singleQuote: false,
  trailingComma: "none",
  printWidth: 100,
  tabWidth: 2,
  plugins: ["prettier-plugin-embed", "prettier-plugin-sql", "prettier-plugin-tailwindcss"]
};

/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {
  embeddedSqlTags: ["sql"]
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: "postgresql",
  keywordCase: "upper"
};

const config = {
  ...prettierConfig,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig
};

export default config;
