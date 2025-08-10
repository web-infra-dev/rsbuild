import type { RsbuildPlugin } from '../types';

export const pluginMoment = (): RsbuildPlugin => ({
  name: 'rsbuild:moment',

  setup(api) {
    api.modifyBundlerChain((chain, { environment, bundler }) => {
      const { config } = environment;

      if (config.performance.removeMomentLocale) {
        // Moment.js includes a lots of locale data by default.
        // We can using IgnorePlugin to allow the user to opt into importing specific locales.
        // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
        chain.plugin('remove-moment-locale').use(bundler.IgnorePlugin, [
          {
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
          },
        ]);
      }
    });
  },
});
