import {
  cjsConfig,
  dualPackage,
  esmConfig,
} from '@rsbuild/config/rslib.config.ts';
import { mergeRsbuildConfig } from '@rsbuild/core';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...dualPackage,
  lib: [
    esmConfig,
    mergeRsbuildConfig(cjsConfig, {
      footer: {
        // TODO https://github.com/web-infra-dev/rslib/issues/351
        js: `// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = { webpackProvider: exports.webpackProvider });`,
      },
    }),
  ],
});
