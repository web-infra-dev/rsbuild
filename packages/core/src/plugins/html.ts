import path, { isAbsolute } from 'node:path';
import {
  applyToCompiler,
  castArray,
  color,
  createVirtualModule,
  fse,
  getDistPath,
  getHtmlMinifyOptions,
  getPublicPathFromChain,
  isFileExists,
  isHtmlDisabled,
  isNil,
  isPlainObject,
  isURL,
  mergeChainedOptions,
} from '@rsbuild/shared';
import type {
  HTMLPluginOptions,
  HtmlConfig,
  ModifyHTMLTagsFn,
  NormalizedConfig,
  RsbuildPluginAPI,
} from '@rsbuild/shared';
import type { EntryDescription } from '@rspack/core';
import type { HtmlInfo, TagConfig } from '../rspack/HtmlBasicPlugin';
import type { RsbuildPlugin } from '../types';

export function getTitle(entryName: string, config: NormalizedConfig) {
  return mergeChainedOptions({
    defaults: '',
    options: config.html.title,
    utils: { entryName },
    useObjectParam: true,
  });
}

export function getInject(entryName: string, config: NormalizedConfig) {
  return mergeChainedOptions({
    defaults: 'head',
    options: config.html.inject,
    utils: { entryName },
    useObjectParam: true,
    isFalsy: isNil,
  });
}

const existTemplatePath: string[] = [];

export async function getTemplate(
  entryName: string,
  config: NormalizedConfig,
  rootPath: string,
): Promise<{ templatePath: string; templateContent?: string }> {
  const DEFAULT_TEMPLATE = path.resolve(
    __dirname,
    '../../static/template.html',
  );

  const templatePath = mergeChainedOptions({
    defaults: DEFAULT_TEMPLATE,
    options: config.html.template,
    utils: { entryName },
    useObjectParam: true,
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

  const templateContent = await fse.readFile(absolutePath, 'utf-8');
  return {
    templatePath: absolutePath,
    templateContent,
  };
}

export function getFavicon(
  entryName: string,
  config: {
    html: HtmlConfig;
  },
) {
  return mergeChainedOptions({
    defaults: '',
    options: config.html.favicon,
    utils: { entryName },
    useObjectParam: true,
  });
}

export function getMetaTags(
  entryName: string,
  config: { html: HtmlConfig },
  templateContent?: string,
) {
  const metaTags = mergeChainedOptions({
    defaults: {},
    options: config.html.meta,
    utils: { entryName },
    useObjectParam: true,
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
  config: NormalizedConfig,
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
    return mergeChainedOptions({
      defaults: defaultOptions,
      options: templateParameters,
      utils: { entryName },
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

const getTagConfig = (api: RsbuildPluginAPI): TagConfig | undefined => {
  const config = api.getNormalizedConfig();
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

export const pluginHtml = (modifyTagsFn: ModifyHTMLTagsFn): RsbuildPlugin => ({
  name: 'rsbuild:html',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { HtmlPlugin, isProd, CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();

        // if html is disabled or target is server, skip html plugin
        if (isHtmlDisabled(config, target)) {
          return;
        }

        const minify = await getHtmlMinifyOptions(isProd, config);
        const assetPrefix = getPublicPathFromChain(chain, false);
        const entries = chain.entryPoints.entries() || {};
        const entryNames = Object.keys(entries);
        const htmlPaths = api.getHTMLPaths();
        const htmlInfoMap: Record<string, HtmlInfo> = {};

        const finalOptions = await Promise.all(
          entryNames.map(async (entryName) => {
            const entryValue = entries[entryName].values();
            const chunks = getChunks(
              entryName,
              // EntryDescription type is different between webpack and Rspack
              entryValue as (string | string[] | EntryDescription)[],
            );
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

            const tagConfig = getTagConfig(api);
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

            const finalOptions = mergeChainedOptions({
              defaults: pluginOptions,
              options:
                typeof config.tools.htmlPlugin === 'boolean'
                  ? {}
                  : config.tools.htmlPlugin,
              utils: {
                entryName,
                entryValue,
              },
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
          .use(HtmlBasicPlugin, [htmlInfoMap, modifyTagsFn]);

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

            const distDir = getDistPath(config, 'image');
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

    api.onAfterCreateCompiler(({ compiler }) => {
      const { nonce } = api.getNormalizedConfig().security;

      if (!nonce) {
        return;
      }

      applyToCompiler(compiler, (compiler) => {
        const { plugins } = compiler.options;
        const hasHTML = plugins.some(
          (plugin) => plugin && plugin.constructor.name === 'HtmlBasicPlugin',
        );
        if (!hasHTML) {
          return;
        }

        // apply __webpack_nonce__
        // https://webpack.js.org/guides/csp/
        const injectCode = createVirtualModule(
          `__webpack_nonce__ = "${nonce}";`,
        );
        new compiler.webpack.EntryPlugin(compiler.context, injectCode, {
          name: undefined,
        }).apply(compiler);
      });
    });

    api.modifyHTMLTags({
      // ensure `crossorigin` and `nonce` can be applied to all tags
      order: 'post',
      handler: ({ headTags, bodyTags }) => {
        const config = api.getNormalizedConfig();
        const { crossorigin } = config.html;
        const { nonce } = config.security;
        const allTags = [...headTags, ...bodyTags];

        if (crossorigin) {
          const formattedCrossorigin =
            crossorigin === true ? 'anonymous' : crossorigin;

          for (const tag of allTags) {
            if (
              (tag.tag === 'script' && tag.attrs?.src) ||
              (tag.tag === 'link' && tag.attrs?.rel === 'stylesheet')
            ) {
              tag.attrs ||= {};
              tag.attrs.crossorigin ??= formattedCrossorigin;
            }
          }
        }

        if (nonce) {
          for (const tag of allTags) {
            if (tag.tag === 'script' || tag.tag === 'style') {
              tag.attrs ??= {};
              tag.attrs.nonce = nonce;
            }
          }
        }

        return { headTags, bodyTags };
      },
    });
  },
});
