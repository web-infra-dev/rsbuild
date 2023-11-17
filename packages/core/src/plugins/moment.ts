import type { RspackPluginInstance, Compiler } from '@rspack/core';
import type { RsbuildPlugin } from '../types';

type IgnorePluginOptions = {
  /**
   * A RegExp to test the context (directory) against.
   */
  contextRegExp?: RegExp;
  /**
   * A RegExp to test the request against.
   */
  resourceRegExp: RegExp;
};

/**
 * modified from https://github.com/webpack/webpack/blob/main/lib/IgnorePlugin.js
 * MIT License http://www.opensource.org/licenses/mit-license.php
 * Author Tobias Koppers @sokra
 * TODO: remove this plugin after Rspack provides IgnorePlugin
 */
class IgnorePlugin implements RspackPluginInstance {
  options: IgnorePluginOptions;

  constructor(options: IgnorePluginOptions) {
    this.options = options;

    this.checkIgnore = this.checkIgnore.bind(this);
  }

  checkIgnore(resolveData: any) {
    if (
      'resourceRegExp' in this.options &&
      this.options.resourceRegExp &&
      this.options.resourceRegExp.test(resolveData.request)
    ) {
      if ('contextRegExp' in this.options && this.options.contextRegExp) {
        // if "contextRegExp" is given,
        // both the "resourceRegExp" and "contextRegExp" have to match.
        if (this.options.contextRegExp.test(resolveData.context)) {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  apply(compiler: Compiler) {
    compiler.hooks.normalModuleFactory.tap('IgnorePlugin', (nmf) => {
      nmf.hooks.beforeResolve.tap('IgnorePlugin', this.checkIgnore);
    });
    compiler.hooks.contextModuleFactory.tap('IgnorePlugin', (cmf) => {
      cmf.hooks.beforeResolve.tap('IgnorePlugin', this.checkIgnore);
    });
  }
}

export const pluginMoment = (): RsbuildPlugin => ({
  name: 'plugin-moment',

  setup(api) {
    api.modifyBundlerChain(async (chain) => {
      const config = api.getNormalizedConfig();

      if (config.performance.removeMomentLocale) {
        // Moment.js includes a lots of locale data by default.
        // We can using IgnorePlugin to allow the user to opt into importing specific locales.
        // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
        chain.plugin('remove-moment-locale').use(IgnorePlugin, [
          {
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
          },
        ]);
      }
    });
  },
});
