import { defineConfig } from '@rsbuild/core';

export default defineConfig((config) => {
  const isProd = config.env === 'production';
  console.log('config.env', config.env);
  console.log('isProd', isProd);
  return {};
});
