// @ts-check
/** @type {import('prebundle').Config} */
export default {
  prettier: true,
  dependencies: [
    {
      name: 'postcss-pxtorem',
      ignoreDts: true,
    },
  ],
};
