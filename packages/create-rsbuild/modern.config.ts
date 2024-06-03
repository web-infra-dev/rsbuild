import { defineConfig, moduleTools } from '@modern-js/module-tools';
import { esmBuildConfig } from '@rsbuild/config/modern.config.ts';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [esmBuildConfig],
});
