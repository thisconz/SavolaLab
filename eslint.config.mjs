// @ts-check
import eslint from "@eslint/js";
import regexpPlugin from "eslint-plugin-regexp";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "built/**",
      "src/lib/*.generated.d.ts",
      "scripts/**/*.ts",
      "scripts/**/*.d.*",
      "dist/**",
      ".next/**",
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  regexpPlugin.configs.recommended,

  {
    files: ["**/*.{ts,tsx,cts,mts,js,cjs,mjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.browser,
      },
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    rules: {
      /* --- ESLint Hardening --- */
      "dot-notation": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-caller": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-eval": "error",
      "no-extra-bind": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-template-curly-in-string": "error",
      "no-throw-literal": "error",
      "no-undef-init": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-const": "error",
      "prefer-object-spread": "error",
      "unicode-bom": ["error", "never"],

      // Zenthar Anti-Null Policy
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[raw=null]",
          message: "Zenthar Protocol Error: Avoid 'null'. Use 'undefined' for optionality.",
        },
        {
          selector: "TSNullKeyword",
          message: "Zenthar Protocol Error: Avoid 'null' in types. Use 'undefined'.",
        },
      ],

      /* --- TypeScript Logic --- */
      "@typescript-eslint/unified-signatures": "error",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "typeLike", format: ["PascalCase"] },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
      ],
    },
  },
);
