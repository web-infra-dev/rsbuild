import { pluginEslint } from '@rsbuild/plugin-eslint';

export default {
  plugins: [
    pluginEslint({
      eslintPluginOptions: {
        cwd: __dirname,
        configType: 'flat',
        eslintPath: 'eslint/use-at-your-own-risk',
      },
    }),
  ],
};
