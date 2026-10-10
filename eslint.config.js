// ============================================================
// REPOGUARD — MANUAL REVIEW REQUIRED: eslint.config.js
// Scanned: 2026-10-10T05:19:23.399Z
// The following findings could NOT be automatically patched:
//   [MEDIUM] high-entropy-secret: High-entropy string detected — possible hardcoded credential or API key
// ============================================================

const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  // Files/paths to ignore (replaces .eslintignore usage in flat config)
  {
    ignores: ["node_modules/**", "dist/**"],
  },

  // TypeScript rules for source files
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Disallow explicit `any`
      "@typescript-eslint/no-explicit-any": "error",

      // You can add or tune more TypeScript rules here
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
