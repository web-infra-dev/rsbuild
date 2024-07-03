import fs from 'node:fs';
import path, { isAbsolute } from 'node:path';
import {
  type MinifyJSOptions,
  castArray,
  color,
  deepmerge,
} from '@rsbuild/shared';
import type {
  HTMLPluginOptions,
  HtmlConfig,
  ModifyHTMLTagsFn,
  NormalizedEnvironmentConfig,
} from '@rsbuild/shared';
import type { EntryDescription } from '@rspack/core';
import { STATIC_PATH } from '../constants';
import {
  getPublicPathFromChain,
  isFileExists,
  isPlainObject,
  isURL,
} from '../helpers';
import {
  reduceConfigsMergeContext,
  reduceConfigsWithContext,
} from '../reduceConfigs';
import type { HtmlInfo, TagConfig } from '../rspack/HtmlBasicPlugin';
import type { RsbuildPlugin } from '../types';
import { parseMinifyOptions } from './minimize';

function applyRemoveConsole(
  options: MinifyJSOptions,
  config: NormalizedEnvironmentConfig,
) {
  const { removeConsole } = config.performance;
  const compressOptions =
    typeof options.compress === 'boolean' ? {} : options.compress || {};

  if (removeConsole === true) {
    options.compress = {
      ...compressOptions,
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map((method) => `console.${method}`);
    options.compress = {
      ...compressOptions,
      pure_funcs: pureFuncs,
    };
  }

  return options;
}

function getTerserMinifyOptions(config: NormalizedEnvironmentConfig) {
  const options: MinifyJSOptions = {
    mangle: {
      safari10: true,
    },
    format: {
      ascii_only: config.output.charset === 'ascii',
    },
  };

  if (config.output.legalComments === 'none') {
    options.format!.comments = false;
  }

  const finalOptions = applyRemoveConsole(options, config);
  return finalOptions;
}

async function getHtmlMinifyOptions(
  isProd: boolean,
  config: NormalizedEnvironmentConfig,
) {
  if (
    !isProd ||
    !config.output.minify ||
    !parseMinifyOptions(config).minifyHtml
  ) {
    return false;
  }

  const minifyJS: MinifyJSOptions = getTerserMinifyOptions(config);

  const htmlMinifyDefaultOptions = {
    removeComments: false,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeEmptyAttributes: true,
    minifyJS,
    minifyCSS: true,
    minifyURLs: true,
  };

  const htmlMinifyOptions = parseMinifyOptions(config).htmlOptions;
  return typeof htmlMinifyOptions === 'object'
    ? deepmerge(htmlMinifyDefaultOptions, htmlMinifyOptions)
    : htmlMinifyDefaultOptions;
}

function getTitle(entryName: string, config: NormalizedEnvironmentConfig) {
  return reduceConfigsMergeContext({
    initial: '',
    config: config.html.title,
    ctx: { entryName },
  });
}

function getInject(entryName: string, config: NormalizedEnvironmentConfig) {
  return reduceConfigsMergeContext({
    initial: 'head',
    config: config.html.inject,
    ctx: { entryName },
  });
}

const existTemplatePath: string[] = [];

export async function getTemplate(
  entryName: string,
  config: NormalizedEnvironmentConfig,
  rootPath: string,
): Promise<{ templatePath: string; templateContent?: string }> {
  const DEFAULT_TEMPLATE = path.resolve(STATIC_PATH, 'template.html');

  const templatePath = reduceConfigsMergeContext({
    initial: DEFAULT_TEMPLATE,
    config: config.html.template,
    ctx: { entryName },
  });

  if (templatePath === DEFAULT_TEMPLATE) {
    return {
      templatePath: templatePath,
    };
  }

  const absolutePath = isAbsolute(templatePath)
    ? templatePath
    : path.resolve(rootPath, templatePath);

  if (!existTemplatePath.includes(absolutePath)) {
    // Check if custom template exists
    if (!(await isFileExists(absolutePath))) {
      throw new Error(
        `Failed to resolve HTML template, please check if the file exists: ${color.cyan(
          absolutePath,
        )}`,
      );
    }

    existTemplatePath.push(absolutePath);
  }

  const templateContent = await fs.promises.readFile(absolutePath, 'utf-8');
  return {
    templatePath: absolutePath,
    templateContent,
  };
}

function getFavicon(
  entryName: string,
  config: {
    html: HtmlConfig;
  },
) {
  return reduceConfigsMergeContext({
    initial: '',
    config: config.html.favicon,
    ctx: { entryName },
  });
}

function getMetaTags(
  entryName: string,
  config: { html: HtmlConfig },
  templateContent?: string,
) {
  const metaTags = reduceConfigsMergeContext({
    initial: {},
    config: config.html.meta,
    ctx: { entryName },
  });

  // `html.meta` will add charset meta by default.
  // If the custom HTML template already contains charset meta, Rsbuild should not inject it again.
  if (templateContent && metaTags.charset) {
    const charsetRegExp = /<meta[^>]+charset=["'][^>]*>/i;
    if (charsetRegExp.test(templateContent)) {
      delete metaTags.charset;
    }
  }

  return metaTags;
}

function getTemplateParameters(
  entryName: string,
  config: NormalizedEnvironmentConfig,
  assetPrefix: string,
): HTMLPluginOptions['templateParameters'] {
  return (compilation, assets, assetTags, pluginOptions) => {
    const { mountId, templateParameters } = config.html;
    const defaultOptions = {
      mountId,
      entryName,
      assetPrefix,
      compilation,
      webpackConfig: compilation.options,
      htmlWebpackPlugin: {
        tags: assetTags,
        files: assets,
        options: pluginOptions,
      },
    };
    return reduceConfigsWithContext({
      initial: defaultOptions,
      config: templateParameters,
      ctx: { entryName },
    });
  };
}

function getChunks(
  entryName: string,
  entryValue: Array<string | string[] | EntryDescription>,
): string[] {
  const chunks = [entryName];

  for (const item of entryValue) {
    if (!isPlainObject(item)) {
      continue;
    }

    const { dependOn } = item as EntryDescription;
    if (!dependOn) {
      continue;
    }

    if (typeof dependOn === 'string') {
      chunks.unshift(dependOn);
    } else {
      chunks.unshift(...dependOn);
    }
  }

  return chunks;
}

const getTagConfig = (
  config: NormalizedEnvironmentConfig,
): TagConfig | undefined => {
  const tags = castArray(config.html.tags).filter(Boolean);

  // skip if options is empty.
  if (!tags.length) {
    return undefined;
  }

  return {
    append: true,
    hash: false,
    publicPath: true,
    tags,
  };
};

export const pluginHtml = (modifyTagsFn?: ModifyHTMLTagsFn): RsbuildPlugin => ({
  name: 'rsbuild:html',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { HtmlPlugin, isProd, CHAIN_ID, environment }) => {
        const { config, htmlPaths } = environment;

        if (Object.keys(htmlPaths).length === 0) {
          return;
        }

        const minify = await getHtmlMinifyOptions(isProd, config);
        const assetPrefix = getPublicPathFromChain(chain, false);
        const entries = chain.entryPoints.entries() || {};
        const entryNames = Object.keys(entries);
        const htmlInfoMap: Record<string, HtmlInfo> = {};

        const finalOptions = await Promise.all(
          entryNames.map(async (entryName) => {
            // EntryDescription type is different between webpack and Rspack
            const entryValue = entries[entryName].values() as (
              | string
              | string[]
              | EntryDescription
            )[];

            const chunks = getChunks(entryName, entryValue);
            const inject = getInject(entryName, config);
            const filename = htmlPaths[entryName];
            const { templatePath, templateContent } = await getTemplate(
              entryName,
              config,
              api.context.rootPath,
            );
            const templateParameters = getTemplateParameters(
              entryName,
              config,
              assetPrefix,
            );

            const metaTags = getMetaTags(entryName, config, templateContent);

            const pluginOptions: HTMLPluginOptions = {
              meta: metaTags,
              chunks,
              inject,
              minify,
              filename,
              template: templatePath,
              entryName,
              templateParameters,
              scriptLoading: config.html.scriptLoading,
            };

            if (chunks.length > 1) {
              // load entires by the order of `chunks`
              pluginOptions.chunksSortMode = 'manual';
            }

            const htmlInfo: HtmlInfo = {};
            htmlInfoMap[entryName] = htmlInfo;

            if (templateContent) {
              htmlInfo.templateContent = templateContent;
            }

            const tagConfig = getTagConfig(environment.config);
            if (tagConfig) {
              htmlInfo.tagConfig = tagConfig;
            }

            pluginOptions.title = getTitle(entryName, config);

            const favicon = getFavicon(entryName, config);
            if (favicon) {
              if (isURL(favicon)) {
                htmlInfo.favicon = favicon;
              } else {
                // HTMLWebpackPlugin only support favicon file path
                pluginOptions.favicon = favicon;
              }
            }

            const finalOptions = reduceConfigsWithContext({
              initial: pluginOptions,
              config:
                typeof config.tools.htmlPlugin === 'boolean'
                  ? {}
                  : config.tools.htmlPlugin,
              ctx: { entryName, entryValue },
            });

            return finalOptions;
          }),
        );

        // keep html entry plugin registration order stable based on entryNames
        entryNames.forEach((entryName, index) => {
          chain
            .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
            .use(HtmlPlugin, [finalOptions[index]]);
        });

        const { HtmlBasicPlugin } = await import('../rspack/HtmlBasicPlugin');

        chain
          .plugin(CHAIN_ID.PLUGIN.HTML_BASIC)
          .use(HtmlBasicPlugin, [htmlInfoMap, environment, modifyTagsFn]);

        if (config.html) {
          const { appIcon, crossorigin } = config.html;

          if (crossorigin) {
            const formattedCrossorigin =
              crossorigin === true ? 'anonymous' : crossorigin;
            chain.output.crossOriginLoading(formattedCrossorigin);
          }

          if (appIcon) {
            const { HtmlAppIconPlugin } = await import(
              '../rspack/HtmlAppIconPlugin'
            );

            const distDir = config.output.distPath.image;
            const iconPath = path.isAbsolute(appIcon)
              ? appIcon
              : path.join(api.context.rootPath, appIcon);

            chain
              .plugin(CHAIN_ID.PLUGIN.APP_ICON)
              .use(HtmlAppIconPlugin, [{ iconPath, distDir }]);
          }
        }
      },
    );

    api.modifyHTMLTags({
      // ensure `crossorigin` and `nonce` can be applied to all tags
      order: 'post',
      handler: ({ headTags, bodyTags }, { environment }) => {
        const { config } = environment;
        const { crossorigin } = config.html;
        const allTags = [...headTags, ...bodyTags];

        if (crossorigin) {
          const formattedCrossorigin =
            crossorigin === true ? 'anonymous' : crossorigin;

          for (const tag of allTags) {
            if (
              (tag.tag === 'script' && tag.attrs?.src) ||
              (tag.tag === 'link' && tag.attrs?.rel === 'stylesheet')
            ) {
              tag.attrs.crossorigin ??= formattedCrossorigin;
            }
          }
        }

        return { headTags, bodyTags };
      },
    });
  },
});
