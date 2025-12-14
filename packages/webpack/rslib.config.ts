import {
  cjsConfig,
  dualPackage,
  esmConfig,
} from '@rsbuild/config/rslib.config.ts';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  ...dualPackage,
  lib: [esmConfig, cjsConfig],
});
