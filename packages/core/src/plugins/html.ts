import fs from 'node:fs';
import path, { isAbsolute } from 'node:path';
import type { EntryDescription } from '@rspack/core';
import {
  reduceConfigsMergeContext,
  reduceConfigsWithContext,
} from 'reduce-configs';
import { castArray, color, isPlainObject } from '../helpers';
import { findExists, isFileExists } from '../helpers/fs';
import { getPublicPathFromChain } from '../helpers/url';
import {
  entryNameSymbol,
  type HtmlExtraData,
  RsbuildHtmlPlugin,
  type TagConfig,
} from '../rspack-plugins/RsbuildHtmlPlugin';
import type {
  HtmlConfig,
  HtmlRspackPlugin,
  InternalContext,
  NormalizedEnvironmentConfig,
  RsbuildPlugin,
} from '../types';

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

const getDefaultTemplateContent = (mountId: string) =>
  `<!doctype html><html><head></head><body><div id="${mountId}"></div></body></html>`;

const existTemplatePath = new Set<string>();

export async function getTemplate(
  entryName: string,
  config: NormalizedEnvironmentConfig,
  rootPath: string,
): Promise<
  | { templatePath: string; templateContent?: string }
  | { templatePath: undefined; templateContent: string }
> {
  const templatePath = reduceConfigsMergeContext({
    initial: '',
    config: config.html.template,
    ctx: { entryName },
  });

  if (!templatePath) {
    return {
      templatePath: undefined,
      templateContent: getDefaultTemplateContent(config.html.mountId),
    };
  }

  const absolutePath = isAbsolute(templatePath)
    ? templatePath
    : path.join(rootPath, templatePath);

  if (!existTemplatePath.has(absolutePath)) {
    // Check if custom template exists
    if (!(await isFileExists(absolutePath))) {
      throw new Error(
        `${color.dim('[rsbuild:html]')} Failed to resolve HTML template, check if the file exists: ${color.yellow(
          absolutePath,
        )}`,
      );
    }

    existTemplatePath.add(absolutePath);
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
): HtmlRspackPlugin.Options['templateParameters'] {
  return (compilation, assets, assetTags, pluginOptions) => {
    const { mountId, templateParameters } = config.html;
    const rspackConfig = compilation.options;
    const htmlPlugin = {
      tags: assetTags,
      files: assets,
      options: pluginOptions,
    };

    const defaultOptions = {
      mountId,
      entryName,
      assetPrefix,
      compilation,
      htmlPlugin,
      rspackConfig,
      /**
       * compatible with html-webpack-plugin
       * @deprecated may be removed in a future major version, use `rspackConfig` instead
       */
      webpackConfig: rspackConfig,
      /**
       * compatible with html-webpack-plugin
       * @deprecated may be removed in a future major version, use `htmlPlugin` instead
       */
      htmlWebpackPlugin: htmlPlugin,
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
  entryValue: (string | string[] | EntryDescription)[],
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

export const pluginHtml = (context: InternalContext): RsbuildPlugin => ({
  name: 'rsbuild:html',

  setup(api) {
    let defaultFavicon: string | undefined;

    const resolveDefaultFavicon = () => {
      if (defaultFavicon) {
        return defaultFavicon;
      }

      const { publicDir } = api.getNormalizedConfig().server;
      const extensions = ['ico', 'png', 'svg'];
      const publicDirs = Array.from(new Set(publicDir.map(({ name }) => name)));

      const faviconPaths: string[] = [];
      for (const publicDir of publicDirs) {
        for (const ext of extensions) {
          faviconPaths.push(path.join(publicDir, `favicon.${ext}`));
        }
      }

      const faviconPath = findExists(faviconPaths);
      if (faviconPath) {
        defaultFavicon = faviconPath;
      }
      return defaultFavicon;
    };

    api.modifyBundlerChain(
      async (chain, { HtmlPlugin, CHAIN_ID, environment }) => {
        const { config, htmlPaths } = environment;

        if (Object.keys(htmlPaths).length === 0) {
          return;
        }

        const assetPrefix = getPublicPathFromChain(chain, false);
        const entries = chain.entryPoints.entries() || {};
        const entryNames = Object.keys(entries).filter((entryName) =>
          Boolean(htmlPaths[entryName]),
        );
        const extraDataMap = new Map<string, HtmlExtraData>();

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

            const pluginOptions: HtmlRspackPlugin.Options = {
              meta: metaTags,
              chunks,
              inject,
              filename,
              entryName,
              templateParameters,
              scriptLoading: config.output.module
                ? 'module'
                : config.html.scriptLoading,
            };

            if (templatePath) {
              pluginOptions.template = templatePath;
            }

            if (chunks.length > 1) {
              // load entires by the order of `chunks`
              pluginOptions.chunksSortMode = 'manual';
            }

            const extraData: HtmlExtraData = {
              entryName,
              context,
              environment,
              faviconDistPath: config.output.distPath.favicon,
            };

            extraDataMap.set(entryName, extraData);

            if (templateContent) {
              extraData.templateContent = templateContent;
            }

            const tagConfig = getTagConfig(environment.config);
            if (tagConfig) {
              extraData.tagConfig = tagConfig;
            }

            pluginOptions.title = getTitle(entryName, config);

            const favicon =
              getFavicon(entryName, config) || resolveDefaultFavicon();
            if (favicon) {
              extraData.favicon = favicon;
            }

            const finalOptions = reduceConfigsWithContext({
              initial: pluginOptions,
              config:
                typeof config.tools.htmlPlugin === 'boolean'
                  ? {}
                  : config.tools.htmlPlugin,
              ctx: { entryName, entryValue },
            });

            // fallback to the default template content
            if (!finalOptions.template && !finalOptions.templateContent) {
              pluginOptions.template = '';
              pluginOptions.templateContent = templateContent;
            }

            return finalOptions;
          }),
        );

        // Follow the order of the entryNames array to keep the HTML plugin registration order stable
        entryNames.forEach((entryName, index) => {
          chain.plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`).use(HtmlPlugin, [
            {
              ...finalOptions[index],
              [entryNameSymbol]: entryName,
            },
          ]);
        });

        const getExtraData = (entryName: string) => extraDataMap.get(entryName);
        const getHTMLPlugin = () => HtmlPlugin;

        chain
          .plugin('rsbuild-html-plugin')
          .use(RsbuildHtmlPlugin, [getExtraData, getHTMLPlugin]);

        if (config.html) {
          const { crossorigin } = config.html;
          if (crossorigin) {
            const formattedCrossorigin =
              crossorigin === true ? 'anonymous' : crossorigin;
            chain.output.crossOriginLoading(formattedCrossorigin);
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
