import path, { isAbsolute } from 'path';
import {
  fse,
  color,
  isURL,
  castArray,
  getMinify,
  getDistPath,
  isFileExists,
  isPlainObject,
  isHtmlDisabled,
  removeTailSlash,
  mergeChainedOptions,
} from '@rsbuild/shared';
import type {
  HtmlConfig,
  RsbuildPluginAPI,
  NormalizedConfig,
  HTMLPluginOptions,
  HtmlInjectTagDescriptor,
} from '@rsbuild/shared';
import type { HtmlTagsPluginOptions } from '../rspack/HtmlTagsPlugin';
import type { HtmlInfo } from '../rspack/HtmlBasicPlugin';
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

function getChunks(entryName: string, entryValue: string | string[]) {
  const dependOn = [];

  if (isPlainObject(entryValue)) {
    // @ts-expect-error assume entry is an entry object
    dependOn.push(...entryValue.dependOn);
  }

  return [...dependOn, entryName];
}

export const applyInjectTags = (api: RsbuildPluginAPI) => {
  api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
    const config = api.getNormalizedConfig();

    const tags = castArray(config.html.tags).filter(Boolean);
    const tagsByEntries = config.html.tagsByEntries || {};
    Object.keys(tagsByEntries).forEach(
      (key) =>
        (tagsByEntries[key] = castArray(tagsByEntries[key]).filter(Boolean)),
    );
    const shouldByEntries = Object.values(tagsByEntries).some(
      (entry) => Array.isArray(entry) && entry.length > 0,
    );

    // skip if options is empty.
    if (!tags.length && !shouldByEntries) {
      return;
    }

    const { HtmlTagsPlugin } = await import('../rspack/HtmlTagsPlugin');

    // create shared options used for entry without specified options.
    const sharedOptions: HtmlTagsPluginOptions = {
      append: true,
      hash: false,
      publicPath: true,
      tags,
    };
    // apply only one webpack plugin if `html.tagsByEntries` is empty.
    if (tags.length && !shouldByEntries) {
      chain
        .plugin(CHAIN_ID.PLUGIN.HTML_TAGS)
        .use(HtmlTagsPlugin, [sharedOptions]);
      return;
    }
    // apply webpack plugin for each entries.
    for (const [entry, filename] of Object.entries(api.getHTMLPaths())) {
      const opts = { ...sharedOptions, includes: [filename] };
      entry in tagsByEntries &&
        (opts.tags = (
          tagsByEntries as Record<string, HtmlInjectTagDescriptor[]>
        )[entry]);
      chain
        .plugin(`${CHAIN_ID.PLUGIN.HTML_TAGS}#${entry}`)
        .use(HtmlTagsPlugin, [opts]);
    }
  });
};

export const pluginHtml = (): RsbuildPlugin => ({
  name: 'rsbuild:html',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { HtmlPlugin, isProd, CHAIN_ID, target }) => {
        const config = api.getNormalizedConfig();

        // if html is disabled or target is server, skip html plugin
        if (isHtmlDisabled(config, target)) {
          return;
        }

        const minify = await getMinify(isProd, config);
        const assetPrefix = removeTailSlash(
          chain.output.get('publicPath') || '',
        );
        const entries = chain.entryPoints.entries() || {};
        const entryNames = Object.keys(entries);
        const htmlPaths = api.getHTMLPaths();
        const htmlInfoMap: Record<string, HtmlInfo> = {};

        await Promise.all(
          entryNames.map(async (entryName) => {
            const entryValue = entries[entryName].values() as string | string[];
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

            const htmlInfo: HtmlInfo = {};
            htmlInfoMap[entryName] = htmlInfo;

            if (templateContent) {
              htmlInfo.templateContent = templateContent;
            }

            const title = getTitle(entryName, config);
            if (title) {
              pluginOptions.title = title;
            }

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
              options: config.tools.htmlPlugin,
              utils: {
                entryName,
                entryValue,
              },
            });

            chain
              .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
              .use(HtmlPlugin, [finalOptions]);
          }),
        );

        const { HtmlBasicPlugin } = await import('../rspack/HtmlBasicPlugin');

        chain
          .plugin(CHAIN_ID.PLUGIN.HTML_BASIC)
          .use(HtmlBasicPlugin, [{ info: htmlInfoMap }]);

        if (config.security) {
          const { nonce } = config.security;

          if (nonce) {
            const { HtmlNoncePlugin } = await import(
              '../rspack/HtmlNoncePlugin'
            );

            chain
              .plugin(CHAIN_ID.PLUGIN.HTML_NONCE)
              .use(HtmlNoncePlugin, [{ nonce }]);
          }
        }

        if (config.html) {
          const { appIcon, crossorigin } = config.html;

          if (crossorigin) {
            const { HtmlCrossOriginPlugin } = await import(
              '../rspack/HtmlCrossOriginPlugin'
            );

            const formattedCrossorigin =
              crossorigin === true ? 'anonymous' : crossorigin;

            chain
              .plugin(CHAIN_ID.PLUGIN.HTML_CROSS_ORIGIN)
              .use(HtmlCrossOriginPlugin, [
                { crossOrigin: formattedCrossorigin },
              ]);

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

    applyInjectTags(api);
  },
});
