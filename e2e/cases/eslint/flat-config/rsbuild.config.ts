import { pluginEslint } from '@rsbuild/plugin-eslint';

export default {
  plugins: [
    pluginEslint({
      eslintPluginOptions: {
        configType: 'flat',
        eslintPath: 'eslint/use-at-your-own-risk',
      },
    }),
  ],
};
