import { transformRefreshAsync } from '@dom-expressions/compiler';
import type { Rspack } from '@rsbuild/core';

export type SolidRefreshLoaderOptions = {
  granular?: boolean;
};

const solidRefreshLoader: Rspack.LoaderDefinition<SolidRefreshLoaderOptions> =
  async function (source, sourceMap): Promise<void> {
    const callback = this.async();
    const { granular } = this.getOptions();

    try {
      const result = await transformRefreshAsync(String(source), {
        filename: this.resourcePath,
        bundler: 'rspack-esm',
        fixRender: true,
        ...(typeof granular === 'boolean' ? { granular } : {}),
        jsx: false,
        importSource: 'solid-js/refresh',
        sourceMap: true,
      });

      callback(
        null,
        result.code,
        result.map ? JSON.parse(result.map) : sourceMap,
      );
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };

export default solidRefreshLoader;
