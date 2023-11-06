import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      format: 'cjs',
      target: 'es2019',
    },
    {
      format: 'esm',
      target: 'es2019',
      autoExtension: true,
      dts: false,
    },
  ],
});
