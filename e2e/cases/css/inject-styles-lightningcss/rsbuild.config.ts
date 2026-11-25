import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  ...(process.env.RSBUILD_E2E_CSS === 'builtin'
    ? { css: { exportType: 'style' } }
    : { output: { injectStyles: true } }),
});
