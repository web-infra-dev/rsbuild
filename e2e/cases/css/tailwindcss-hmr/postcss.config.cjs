module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      // Ensure tailwindcss only watch files in the current directory
      base: __dirname,
    },
  },
};
