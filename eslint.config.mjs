import js from '@eslint/js';
import globals from 'globals';
import * as tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  js.configs.recommended, // Optional: JS base rules

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json', // Optional if using type-aware linting
      },
      globals: globals.browser,
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/max-len': ['error', { code: 100 }],
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
      }],
      'no-console': 'error',
    },
  },

  // Add TypeScript's strict rules
  ...tseslint.configs.strict,

  // Add stylistic rules from typescript-eslint
  ...tseslint.configs.stylistic,
]);