/// <reference types="./declarations.d.ts" />
// @ts-check

import eslint from "@eslint/js"
import { defineConfig } from "eslint/config"
import pluginImport from "eslint-plugin-import"
import pluginPerfectionist from "eslint-plugin-perfectionist"
import globals from "globals"
import tseslint from "typescript-eslint"

const isVSCode = Boolean(process.env.VSCODE_PID)

export default defineConfig(
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    ignores: ["**/node_modules", "**/dist", "**/.next", "**/crates/**/target"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  eslint.configs.recommended,
  {
    rules: {
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "prefer-const": ["warn", { destructuring: "all" }],
    },
  },

  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-empty-object-type": [
        "warn",
        {
          allowInterfaces: "always",
          allowObjectTypes: "never",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-namespace": [
        "warn",
        {
          allowDeclarations: true,
          allowDefinitionFiles: true,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        isVSCode ? "off" : "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  {
    plugins: {
      import: pluginImport,
    },
    rules: {
      "import/first": "warn",
      "import/newline-after-import": "warn",
      "import/no-duplicates": ["warn", { "prefer-inline": true }],
      "import/order": [
        "warn",
        {
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          groups: ["builtin", "external", "parent", ["sibling", "index"]],
          named: true,
          "newlines-between": "always",
        },
      ],
    },
  },

  {
    plugins: {
      perfectionist: pluginPerfectionist,
    },
    rules: {
      "perfectionist/sort-exports": ["warn", { partitionByNewLine: true }],
    },
  },
)
