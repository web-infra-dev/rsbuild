const path = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, './src/**/*.{html,js,ts,jsx,tsx}')],
  theme: {
    extend: {},
  },
  plugins: [],
};
