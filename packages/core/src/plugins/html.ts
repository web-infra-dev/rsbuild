import path from 'path';
import {
  isURL,
  castArray,
  getTitle,
  getMinify,
  getInject,
  getFavicon,
  getDistPath,
  isFileExists,
  isPlainObject,
  isHtmlDisabled,
  HtmlMetaPlugin,
  HtmlTitlePlugin,
  getTemplatePath,
  ROUTE_SPEC_FILE,
  removeTailSlash,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { fs } from '@rsbuild/shared/fs-extra';
import type {
  HtmlConfig,
  MetaOptions,
  FaviconUrls,
  NormalizedConfig,
  HTMLPluginOptions,
  DefaultRsbuildPlugin,
  HtmlMetaPluginOptions,
  HtmlTagsPluginOptions,
  HtmlTitlePluginOptions,
  SharedRsbuildPluginAPI,
  NormalizedOutputConfig,
} from '@rsbuild/shared';
import _ from 'lodash';
import { generateMetaTags } from '../utils/generateMetaTags';

// This is a minimist subset of modern.js server routes
type RoutesInfo = {
  isSPA: boolean;
  urlPath: string;
  entryName: string;
  entryPath: string;
};

export async function getMetaTags(
  entryName: string,
  config: { html: HtmlConfig; output: NormalizedOutputConfig },
) {
  const { meta, metaByEntries } = config.html;
  const metaOptions: MetaOptions = {};

  Object.assign(metaOptions, meta, metaByEntries?.[entryName]);

  return generateMetaTags(metaOptions);
}

async function getTemplateParameters(
  entryName: string,
  config: NormalizedConfig,
  assetPrefix: string,
): Promise<HTMLPluginOptions['templateParameters']> {
  const { mountId, templateParameters, templateParametersByEntries } =
    config.html;

  const templateParams =
    templateParametersByEntries?.[entryName] || templateParameters;
  const baseParameters = {
    mountId,
    entryName,
    assetPrefix,
  };

  return (compilation, assets, assetTags, pluginOptions) => {
    const defaultOptions = {
      compilation,
      webpackConfig: compilation.options,
      htmlWebpackPlugin: {
        tags: assetTags,
        files: assets,
        options: pluginOptions,
      },
      ...baseParameters,
    };
    return mergeChainedOptions(defaultOptions, templateParams);
  };
}

async function getChunks(entryName: string, entryValue: string | string[]) {
  const dependOn = [];

  if (isPlainObject(entryValue)) {
    // @ts-expect-error assume entry is an entry object
    dependOn.push(...entryValue.dependOn);
  }

  return [...dependOn, entryName];
}

export const applyInjectTags = (api: SharedRsbuildPluginAPI) => {
  api.modifyBundlerChain(async (chain, { HtmlPlugin, CHAIN_ID }) => {
    const config = api.getNormalizedConfig();

    const tags = castArray(config.html.tags).filter(Boolean);
    const tagsByEntries = _.mapValues(config.html.tagsByEntries, (tags) =>
      castArray(tags).filter(Boolean),
    );
    const shouldByEntries = _.some(tagsByEntries, 'length');

    // skip if options is empty.
    if (!tags.length && !shouldByEntries) {
      return;
    }
    // dynamic import.
    const { HtmlTagsPlugin } = await import('@rsbuild/shared');
    // const { HtmlTagsPlugin } = await import('../webpackPlugins/HtmlTagsPlugin');
    // create shared options used for entry without specified options.
    const sharedOptions: HtmlTagsPluginOptions = {
      HtmlPlugin,
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
      entry in tagsByEntries && (opts.tags = tagsByEntries[entry]);
      chain
        .plugin(`${CHAIN_ID.PLUGIN.HTML_TAGS}#${entry}`)
        .use(HtmlTagsPlugin, [opts]);
    }
  });
};

export const pluginHtml = (): DefaultRsbuildPlugin => ({
  name: 'plugin-html',

  setup(api) {
    const routesInfo: RoutesInfo[] = [];

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
        const faviconUrls: FaviconUrls = [];

        const metaPluginOptions: HtmlMetaPluginOptions = {
          meta: {},
          HtmlPlugin,
        };
        const titlePluginOptions: HtmlTitlePluginOptions = {
          titles: {},
          HtmlPlugin,
        };

        await Promise.all(
          entryNames.map(async (entryName, index) => {
            const entryValue = entries[entryName].values() as string | string[];
            const chunks = await getChunks(entryName, entryValue);
            const inject = getInject(entryName, config);
            const favicon = getFavicon(entryName, config);
            const filename = htmlPaths[entryName];
            const template = getTemplatePath(entryName, config);
            const metaTags = await getMetaTags(entryName, config);
            const title = await getTitle(entryName, config);
            const templateParameters = await getTemplateParameters(
              entryName,
              config,
              assetPrefix,
            );

            if (metaTags.length) {
              metaPluginOptions.meta[filename] = metaTags;
            }
            if (title) {
              titlePluginOptions.titles[filename] = title;
            }

            const pluginOptions: HTMLPluginOptions = {
              chunks,
              inject,
              minify,
              filename,
              template,
              templateParameters,
              scriptLoading: config.html.scriptLoading,
            };

            if (favicon) {
              if (isURL(favicon)) {
                faviconUrls.push({
                  filename,
                  url: favicon,
                });
              } else {
                // HTMLWebpackPlugin only support favicon file path
                pluginOptions.favicon = favicon;
              }
            }

            const finalOptions = mergeChainedOptions(
              pluginOptions,
              (config.tools as { htmlPlugin?: any }).htmlPlugin,
              {
                entryName,
                entryValue,
              },
            );

            routesInfo.push({
              urlPath: index === 0 ? '/' : `/${entryName}`,
              entryName,
              entryPath: filename,
              isSPA: true,
            });

            chain
              .plugin(`${CHAIN_ID.PLUGIN.HTML}-${entryName}`)
              .use(HtmlPlugin, [finalOptions]);
          }),
        );

        if (Object.keys(metaPluginOptions.meta).length) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_META)
            .use(HtmlMetaPlugin, [metaPluginOptions]);
        }

        if (Object.keys(titlePluginOptions.titles).length) {
          chain
            .plugin(CHAIN_ID.PLUGIN.HTML_TITLE)
            .use(HtmlTitlePlugin, [titlePluginOptions]);
        }

        if (config.security) {
          const { nonce } = config.security;

          if (nonce) {
            const { HtmlNoncePlugin } = await import('@rsbuild/shared');

            chain
              .plugin(CHAIN_ID.PLUGIN.HTML_NONCE)
              .use(HtmlNoncePlugin, [{ nonce, HtmlPlugin }]);
          }
        }

        if (config.html) {
          const { appIcon, crossorigin } = config.html;

          if (crossorigin) {
            const { HtmlCrossOriginPlugin } = await import('@rsbuild/shared');

            const formattedCrossorigin =
              crossorigin === true ? 'anonymous' : crossorigin;

            chain
              .plugin(CHAIN_ID.PLUGIN.HTML_CROSS_ORIGIN)
              .use(HtmlCrossOriginPlugin, [
                { crossOrigin: formattedCrossorigin, HtmlPlugin },
              ]);

            chain.output.crossOriginLoading(formattedCrossorigin);
          }

          if (faviconUrls.length) {
            const { HtmlFaviconUrlPlugin } = await import('@rsbuild/shared');

            chain
              .plugin(CHAIN_ID.PLUGIN.FAVICON_URL)
              .use(HtmlFaviconUrlPlugin, [{ faviconUrls, HtmlPlugin }]);
          }

          if (appIcon) {
            const { HtmlAppIconPlugin } = await import('@rsbuild/shared');

            const distDir = getDistPath(config.output, 'image');
            const iconPath = path.isAbsolute(appIcon)
              ? appIcon
              : path.join(api.context.rootPath, appIcon);

            chain
              .plugin(CHAIN_ID.PLUGIN.APP_ICON)
              .use(HtmlAppIconPlugin, [{ iconPath, distDir, HtmlPlugin }]);
          }
        }
      },
    );

    const emitRouteJson = async () => {
      const routeFilePath = path.join(api.context.distPath, ROUTE_SPEC_FILE);

      // generate a basic route.json for modern.js server
      // if the framework has already generate a route.json, do nothing
      if (!(await isFileExists(routeFilePath)) && routesInfo.length) {
        await fs.outputFile(
          routeFilePath,
          JSON.stringify({ routes: routesInfo }, null, 2),
        );
      }
    };

    api.onBeforeBuild(emitRouteJson);
    api.onBeforeStartDevServer(emitRouteJson);

    applyInjectTags(api);
  },
});
