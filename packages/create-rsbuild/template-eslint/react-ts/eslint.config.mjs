import { fixupConfigRules } from '@eslint/compat';
import js from '@eslint/js';
import react from 'eslint-plugin-react/configs/recommended.js';
import globals from 'globals';
import ts from 'typescript-eslint';

export default [
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...fixupConfigRules(react),
  { ignores: ['dist/'] },
];
