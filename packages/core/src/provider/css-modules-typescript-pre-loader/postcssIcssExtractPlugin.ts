// @ts-expect-error
import { extractICSS } from '@rsbuild/shared/icss-utils';
import { camelCase, type CssModuleLocalsConvention } from '@rsbuild/shared';

import type { AcceptedPlugin as PostCSSPlugin } from 'postcss';

const dashesCamelCase = (str: string) =>
  str.replace(/-+(\w)/g, (_match, firstLetter) => firstLetter.toUpperCase());

export type PostcssParsePluginOptions = {
  exportLocalsConvention: CssModuleLocalsConvention;
  cssModuleKeys: string[];
};

const getExportLocalsConvention = (
  name: string,
  exportLocalsConventionType: CssModuleLocalsConvention,
) => {
  switch (exportLocalsConventionType) {
    case 'camelCase': {
      const camelName = camelCase(name);
      return camelName === name ? [name] : [name, camelCase(name)];
    }
    case 'camelCaseOnly': {
      return [camelCase(name)];
    }
    case 'dashes': {
      const dashesCamelName = dashesCamelCase(name);
      return dashesCamelName === name ? [name] : [name, dashesCamelCase(name)];
    }
    case 'dashesOnly': {
      return [dashesCamelCase(name)];
    }
    default:
      return [name];
  }
};

const plugin = (options: PostcssParsePluginOptions): PostCSSPlugin => {
  return {
    postcssPlugin: 'postcss-icss-extract',
    OnceExit(root) {
      const { icssExports } = extractICSS(root);

      const cssModuleKeys = Object.keys(icssExports).reduce<string[]>(
        (total, key) => {
          total.push(
            ...getExportLocalsConvention(key, options.exportLocalsConvention),
          );
          return total;
        },
        [],
      );

      options.cssModuleKeys = cssModuleKeys;
    },
  };
};

plugin.postcss = true;

export default plugin;
