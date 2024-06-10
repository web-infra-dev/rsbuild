import { fixupConfigRules } from '@eslint/compat';
import js from '@eslint/js';
import react from 'eslint-plugin-react/configs/recommended.js';
import globals from 'globals';

export default [
  { languageOptions: { globals: globals.browser } },
  js.configs.recommended,
  ...fixupConfigRules(react),
  { ignores: ['dist/'] },
];
