const js = require("@eslint/js");
const globals = require("globals");
const html = require("eslint-plugin-html");

module.exports = [
  {
    ignores: ["node_modules/**", "coverage/**"],
  },
  {
    files: ["**/*.js"],
    ignores: ["modules/aws/cloudfront/functions/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["modules/aws/cloudfront/functions/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-console": "error",
    },
  },
  {
    files: ["scripts/**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.html"],
    ...js.configs.recommended,
    plugins: {
      html,
    },
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
    },
  },
];
