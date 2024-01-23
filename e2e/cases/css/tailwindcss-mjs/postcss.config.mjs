import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: {
      config: join(__dirname, './tailwind.config.mjs'),
    },
  },
};
