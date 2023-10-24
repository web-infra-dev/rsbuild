import type { RsbuildPlugin } from '../types';
import { mergeChainedOptions, type PugOptions } from '@rsbuild/shared';
import { getCompiledPath } from '../shared';

const getPugTemplateCompiler = (userOptions: PugOptions) => ({
  async compile(
    content: string,
    compileOptions: {
      filename: string;
    },
  ) {
    const options = {
      filename: compileOptions.filename,
      doctype: 'html',
      compileDebug: false,
      ...userOptions,
    };
    const pug = require(getCompiledPath('pug'));
    return `${pug.compileClient(content, options)};\ntemplate;`;
  },
});

export const pluginPug = (): RsbuildPlugin => ({
  name: 'plugin-pug',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const { pug } = config.tools;
      if (!pug) {
        return;
      }

      const entries = chain.entryPoints.entries() || {};
      const entryNames = Object.keys(entries);

      const pugOptions = mergeChainedOptions({}, pug === true ? {} : pug);
      // not support childCompiler in Rspack html-plugin, use templateCompiler instead.
      const templateCompiler = getPugTemplateCompiler(pugOptions);

      entryNames.forEach((entry) => {
        chain.plugin(`${CHAIN_ID.PLUGIN.HTML}-${entry}`).tap((options) => {
          if (options[0]?.template.endsWith('.pug')) {
            options[0].templateCompiler = templateCompiler;
          }
          return options;
        });
      });
    });
  },
});
