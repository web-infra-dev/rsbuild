import path from 'node:path';
import { isRegExp } from 'node:util/types';
import { CSS_REGEX, JS_REGEX } from '../constants';
import {
  addTrailingSlash,
  getPublicPathFromCompiler,
  isFunction,
} from '../helpers';
import type {
  HtmlBasicTag,
  InlineChunkTest,
  NormalizedEnvironmentConfig,
  RsbuildPlugin,
  Rspack,
} from '../types';

/**
 * If we inlined the chunk to HTML,we should update the value of sourceMappingURL,
 * because the relative path of source code has been changed.
 */
function updateSourceMappingURL({
  source,
  compilation,
  publicPath,
  type,
  config,
}: {
  source: string;
  compilation: Rspack.Compilation;
  publicPath: string;
  type: 'js' | 'css';
  config: NormalizedEnvironmentConfig;
}) {
  const { devtool } = compilation.options;

  if (
    devtool &&
    // If the source map is inlined, we do not need to update the sourceMappingURL
    !devtool.includes('inline') &&
    source.includes('# sourceMappingURL')
  ) {
    const prefix = addTrailingSlash(
      path.join(publicPath, config.output.distPath[type] || ''),
    );

    return source.replace(
      /# sourceMappingURL=/,
      `# sourceMappingURL=${prefix}`,
    );
  }

  return source;
}

function matchTests(
  name: string,
  asset: Rspack.sources.Source,
  tests: InlineChunkTest[],
) {
  return tests.some((test) => {
    if (isFunction(test)) {
      const size = asset.size();
      return test({ name, size });
    }
    return test.exec(name);
  });
}

export const getInlineTests = (
  config: NormalizedEnvironmentConfig,
): {
  scriptTests: InlineChunkTest[];
  styleTests: InlineChunkTest[];
} => {
  const isProd = config.mode === 'production';
  const { inlineStyles, inlineScripts } = config.output;
  const scriptTests: InlineChunkTest[] = [];
  const styleTests: InlineChunkTest[] = [];

  if (inlineScripts) {
    if (inlineScripts === true) {
      isProd && scriptTests.push(JS_REGEX);
    } else if (isRegExp(inlineScripts) || isFunction(inlineScripts)) {
      isProd && scriptTests.push(inlineScripts);
    } else {
      const enabled =
        inlineScripts.enable === 'auto' ? isProd : inlineScripts.enable;
      if (enabled) {
        scriptTests.push(inlineScripts.test);
      }
    }
  }

  if (inlineStyles) {
    if (inlineStyles === true) {
      isProd && styleTests.push(CSS_REGEX);
    } else if (isRegExp(inlineStyles) || isFunction(inlineStyles)) {
      isProd && styleTests.push(inlineStyles);
    } else {
      const enable =
        inlineStyles.enable === 'auto' ? isProd : inlineStyles.enable;
      if (enable) {
        styleTests.push(inlineStyles.test);
      }
    }
  }

  return { scriptTests, styleTests };
};

export const pluginInlineChunk = (): RsbuildPlugin => ({
  name: 'rsbuild:inline-chunk',

  setup(api) {
    const inlinedAssets = new Set<string>();

    const getInlinedScriptTag = (
      publicPath: string,
      tag: HtmlBasicTag,
      compilation: Rspack.Compilation,
      scriptTests: InlineChunkTest[],
      config: NormalizedEnvironmentConfig,
    ) => {
      const { assets } = compilation;

      // No need to inline scripts with src attribute
      if (!(tag.attrs?.src && typeof tag.attrs.src === 'string')) {
        return tag;
      }

      const { src, ...otherAttrs } = tag.attrs;
      const scriptName = publicPath ? src.replace(publicPath, '') : src;

      // If asset is not found, skip it
      const asset = assets[scriptName];
      if (asset == null) {
        return tag;
      }

      const shouldInline = matchTests(scriptName, asset, scriptTests);
      if (!shouldInline) {
        return tag;
      }

      const source = asset.source().toString();
      const ret: HtmlBasicTag = {
        tag: 'script',
        children: updateSourceMappingURL({
          source,
          compilation,
          publicPath,
          type: 'js',
          config,
        }),
        attrs: {
          ...otherAttrs,
        },
      };

      // mark asset has already been inlined
      inlinedAssets.add(scriptName);

      return ret;
    };

    const getInlinedCSSTag = (
      publicPath: string,
      tag: HtmlBasicTag,
      compilation: Rspack.Compilation,
      styleTests: InlineChunkTest[],
      config: NormalizedEnvironmentConfig,
    ) => {
      const { assets } = compilation;

      // No need to inline styles with href attribute
      if (!(tag.attrs?.href && typeof tag.attrs.href === 'string')) {
        return tag;
      }

      const linkName = publicPath
        ? tag.attrs.href.replace(publicPath, '')
        : tag.attrs.href;

      // If asset is not found, skip it
      const asset = assets[linkName];
      if (asset == null) {
        return tag;
      }

      const shouldInline = matchTests(linkName, asset, styleTests);
      if (!shouldInline) {
        return tag;
      }

      const source = asset.source().toString();
      const ret: HtmlBasicTag = {
        tag: 'style',
        children: updateSourceMappingURL({
          source,
          compilation,
          publicPath,
          type: 'css',
          config,
        }),
      };

      // mark asset has already been inlined
      inlinedAssets.add(linkName);

      return ret;
    };

    const getInlinedTag = (
      publicPath: string,
      tag: HtmlBasicTag,
      compilation: Rspack.Compilation,
      scriptTests: InlineChunkTest[],
      styleTests: InlineChunkTest[],
      config: NormalizedEnvironmentConfig,
    ) => {
      if (tag.tag === 'script') {
        return getInlinedScriptTag(
          publicPath,
          tag,
          compilation,
          scriptTests,
          config,
        );
      }
      if (tag.tag === 'link' && tag.attrs && tag.attrs.rel === 'stylesheet') {
        return getInlinedCSSTag(
          publicPath,
          tag,
          compilation,
          styleTests,
          config,
        );
      }
      return tag;
    };

    api.processAssets(
      {
        /**
         * Remove marked inline assets in summarize stage,
         * which should be later than the emitting of html-rspack-plugin
         */
        stage: 'summarize',
      },
      ({ compiler, compilation }) => {
        if (inlinedAssets.size === 0) {
          return;
        }

        const { devtool } = compiler.options;

        for (const name of inlinedAssets) {
          // If the source map reference is removed,
          // we do not need to preserve the source map of inlined files
          if (devtool === 'hidden-source-map' || devtool === false) {
            compilation.deleteAsset(name);
          } else {
            // use delete instead of compilation.deleteAsset
            // because we want to preserve the related files such as source map
            delete compilation.assets[name];
          }
        }

        inlinedAssets.clear();
      },
    );

    api.modifyHTMLTags(
      ({ headTags, bodyTags }, { compiler, compilation, environment }) => {
        const { htmlPaths, config } = environment;

        if (Object.keys(htmlPaths).length === 0) {
          return { headTags, bodyTags };
        }

        const { scriptTests, styleTests } = getInlineTests(config);

        if (!scriptTests.length && !styleTests.length) {
          return { headTags, bodyTags };
        }

        const publicPath = getPublicPathFromCompiler(compiler);

        const updateTag = (tag: HtmlBasicTag) =>
          getInlinedTag(
            publicPath,
            tag,
            compilation,
            scriptTests,
            styleTests,
            environment.config,
          );

        return {
          headTags: headTags.map(updateTag),
          bodyTags: bodyTags.map(updateTag),
        };
      },
    );
  },
});
