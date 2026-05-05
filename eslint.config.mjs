// @ts-check
import eslint from "@eslint/js";
import regexpPlugin from "eslint-plugin-regexp";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // ── Ignores ──────────────────────────────────────────────────────────────
  {
    ignores: [
      "**/node_modules/**",
      "built/**",
      "dist/**",
      ".next/**",
      "src/lib/*.generated.d.ts",
      "scripts/**/*.ts",
      "scripts/**/*.d.*",
      "scripts/output/**",
    ],
  },

  // ── Base rule sets ────────────────────────────────────────────────────────
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  regexpPlugin.configs.recommended,

  // ── Shared: all TS/JS files ───────────────────────────────────────────────
  {
    files: ["**/*.{ts,tsx,cts,mts,js,cjs,mjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.browser,
      },
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
      },
    },
    rules: {
      // ── ESLint Hardening ────────────────────────────────────────────────
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
          message: "Zenthar Protocol: Avoid 'null'. Use 'undefined' for optionality.",
        },
        {
          selector: "TSNullKeyword",
          message: "Zenthar Protocol: Avoid 'null' in types. Use 'undefined'.",
        },
      ],

      // ── TypeScript rules ────────────────────────────────────────────────
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
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
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

  // ── React / TSX files ─────────────────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooksPlugin,
      react: reactPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // React Hooks — prevents the most common React bugs
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React best practices
      "react/jsx-no-target-blank": "error",
      "react/no-danger": "error",
      "react/no-array-index-key": "warn",
      "react/self-closing-comp": "error",
      "react/jsx-curly-brace-presence": ["error", { props: "never", children: "never" }],
    },
  },

  // ── Server-only files ─────────────────────────────────────────────────────
  {
    files: ["server/**/*.ts"],
    rules: {
      // Server code can use console for bootstrapping (logger not yet ready)
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // ── Test files (relaxed) ──────────────────────────────────────────────────
  {
    files: ["tests/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
