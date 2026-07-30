import type { Config } from 'prettier';

export default {
  plugins: ['prettier-plugin-packagejson'],
  printWidth: 100,
  singleQuote: true,
} satisfies Config;
