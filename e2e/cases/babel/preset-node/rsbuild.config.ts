import { pluginBabel } from '@rsbuild/plugin-babel';

export default {
  output: {
    targets: ['node'],
  },
  plugins: [
    pluginBabel({
      babelLoaderOptions: (_, { addPresets }) => {
        addPresets([require.resolve('@rsbuild/babel-preset/web')]);
      },
    }),
  ],
};
