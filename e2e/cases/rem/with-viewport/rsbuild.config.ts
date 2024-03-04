import { defineConfig } from '@rsbuild/core';
import { pluginRem } from '@rsbuild/plugin-rem';

export const viewportValue =
  'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';

export default defineConfig({
  plugins: [pluginRem()],
  html: {
    meta: {
      viewport: viewportValue,
    },
  },
});
