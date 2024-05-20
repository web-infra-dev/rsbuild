import { pluginBabel } from '@rsbuild/plugin-babel';

export default {
  plugins: [
    pluginBabel({
      babelLoaderOptions: (_, { addPresets }) => {
        addPresets([require.resolve('@rsbuild/babel-preset/node')]);
      },
    }),
  ],
};
