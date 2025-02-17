import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default {
  plugins: [require('./postcssPlugin.cjs')],
};
