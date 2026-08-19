import { transformRefreshAsync } from '@dom-expressions/compiler';
import type { Rspack } from '@rsbuild/core';

const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;
const JSX_REGEX = /\.(?:jsx|tsx)$/;
const TS_REGEX = /\.(?:ts|tsx|mts|cts)$/;

const getTransformFilename = (filename: string): string =>
  JSX_REGEX.test(filename)
    ? filename
    : `${filename}${TS_REGEX.test(filename) ? '.tsx' : '.jsx'}`;

export type SolidRefreshLoaderOptions = {
  granular?: boolean;
};

const solidRefreshLoader: Rspack.LoaderDefinition<SolidRefreshLoaderOptions> =
  async function (source, sourceMap): Promise<void> {
    const callback = this.async();
    const { granular } = this.getOptions();

    if (NODE_MODULES_REGEX.test(this.resourcePath)) {
      callback(null, source, sourceMap);
      return;
    }

    try {
      const result = await transformRefreshAsync(String(source), {
        filename: getTransformFilename(this.resourcePath),
        bundler: 'rspack-esm',
        fixRender: true,
        ...(typeof granular === 'boolean' ? { granular } : {}),
        jsx: false,
        importSource: 'solid-js/refresh',
        sourceMap: true,
      });

      let resultMap = sourceMap;
      if (result.map) {
        resultMap = JSON.parse(result.map) as Rspack.RawSourceMap;
        resultMap.sources = [this.resourcePath];
      }

      callback(null, result.code, resultMap);
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };

export default solidRefreshLoader;
