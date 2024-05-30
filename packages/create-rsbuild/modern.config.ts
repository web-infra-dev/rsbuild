import { defineConfig, moduleTools } from '@modern-js/module-tools';
import { esmBuildConfig } from '@rsbuild/config/modern';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [esmBuildConfig],
});
