import path from 'path';
import {
  isURL,
  castArray,
  getMinify,
  getDistPath,
  isFileExists,
  isPlainObject,
  isHtmlDisabled,
  ROUTE_SPEC_FILE,
  removeTailSlash,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { fs } from '@rsbuild/shared/fs-extra';
import type {
  MetaAttrs,
  HtmlConfig,
  MetaOptions,
  NormalizedConfig,
  HTMLPluginOptions,
  DefaultRsbuildPlugin,
  HtmlTagsPluginOptions,
  SharedRsbuildPluginAPI,
  NormalizedOutputConfig,
} from '@rsbuild/shared';
import _ from 'lodash';
import {
  HtmlBasicPlugin,
  type HtmlInfo,
} from '../rspack-plugins/HtmlBasicPlugin';

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

export function getTemplatePath(entryName: string, config: NormalizedConfig) {
  const DEFAULT_TEMPLATE = path.resolve(
    __dirname,
    '../../static/template.html',
  );
  return mergeChainedOptions({
    defaults: DEFAULT_TEMPLATE,
    options: config.html.template,
    utils: { entryName },
    useObjectParam: true,
  });
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

export const generateMetaTags = (metaOptions?: MetaOptions): MetaAttrs[] => {
  if (!metaOptions) {
    return [];
  }

  return Object.keys(metaOptions)
    .map((metaName) => {
      const metaTagContent = metaOptions[metaName];
      return typeof metaTagContent === 'string'
        ? {
            name: metaName,
            content: metaTagContent,
          }
        : metaTagContent;
    })
    .filter(Boolean) as MetaAttrs[];
};

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
  const merged = mergeChainedOptions({
    defaults: {},
    options: config.html.meta,
    utils: { entryName },
    useObjectParam: true,
  });
  return generateMetaTags(merged);
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
    return mergeChainedOptions({
      defaults: defaultOptions,
      options: templateParams,
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
        const htmlInfoMap: Record<string, HtmlInfo> = {};

        await Promise.all(
          entryNames.map(async (entryName, index) => {
            const entryValue = entries[entryName].values() as string | string[];
            const chunks = getChunks(entryName, entryValue);
            const inject = getInject(entryName, config);
            const filename = htmlPaths[entryName];
            const template = getTemplatePath(entryName, config);
            const templateParameters = await getTemplateParameters(
              entryName,
              config,
              assetPrefix,
            );

            const pluginOptions: HTMLPluginOptions = {
              chunks,
              inject,
              minify,
              filename,
              template,
              templateParameters,
              scriptLoading: config.html.scriptLoading,
            };

            const htmlInfo: HtmlInfo = {};
            htmlInfoMap[filename] = htmlInfo;

            const title = getTitle(entryName, config);
            if (title) {
              htmlInfo.title = title;
            }

            const metaTags = await getMetaTags(entryName, config);
            if (metaTags.length) {
              htmlInfo.meta = metaTags;
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

        chain
          .plugin(CHAIN_ID.PLUGIN.HTML_BASIC)
          .use(HtmlBasicPlugin, [{ HtmlPlugin, info: htmlInfoMap }]);

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
