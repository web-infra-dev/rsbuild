import { defineConfig, moduleTools } from '@modern-js/module-tools';
import { esmBuildConfig } from '../../scripts/modern.base.config';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [esmBuildConfig],
});
