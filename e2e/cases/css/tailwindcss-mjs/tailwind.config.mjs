import { join } from 'node:path';

/** @type {import('tailwindcss').Config} */
export default {
  content: [join(__dirname, './src/**/*.{html,js,ts,jsx,tsx}')],
  theme: {
    extend: {},
  },
  plugins: [],
};
