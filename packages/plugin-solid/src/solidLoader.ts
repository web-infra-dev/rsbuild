import { createRequire } from 'node:module';
import {
  transformAsync as babelTransformAsync,
  type TransformOptions,
} from '@babel/core';
import {
  transformAsync as nativeTransformAsync,
  type TransformOptions as NativeTransformOptions,
} from '@dom-expressions/compiler';
import remapping from '@jridgewell/remapping';
import type { Rspack } from '@rsbuild/core';
import type { SolidCompiler, SolidPresetOptions } from './types.js';

const require = createRequire(import.meta.url);
const BABEL_PRESET_SOLID_PATH = require.resolve('babel-preset-solid');

export type SolidLoaderOptions = {
  compiler: SolidCompiler;
  solid: SolidPresetOptions;
};

const normalizeSourceMap = (
  sourceMap: Rspack.RawSourceMap | string | undefined,
): Rspack.RawSourceMap | undefined =>
  typeof sourceMap === 'string'
    ? (JSON.parse(sourceMap) as Rspack.RawSourceMap)
    : sourceMap;

const mergeSourceMaps = (
  sourceMap: Rspack.RawSourceMap | undefined,
  generatedMap: string | null | undefined,
): Rspack.RawSourceMap | undefined => {
  if (!generatedMap) {
    return sourceMap;
  }

  const parsedMap = JSON.parse(generatedMap) as Rspack.RawSourceMap;
  if (!sourceMap) {
    return parsedMap;
  }

  return remapping(
    [parsedMap, sourceMap] as Parameters<typeof remapping>[0],
    () => null,
  ) as Rspack.RawSourceMap;
};

const solidLoader: Rspack.LoaderDefinition<SolidLoaderOptions> =
  async function (source, sourceMap): Promise<void> {
    const callback = this.async();
    const { compiler, solid } = this.getOptions();
    const filename = this.resourcePath;
    const inputSourceMap = normalizeSourceMap(sourceMap);

    try {
      if (compiler === 'babel') {
        const parserPlugins: NonNullable<
          NonNullable<TransformOptions['parserOpts']>['plugins']
        > = ['jsx', 'decorators'];

        if (/\.tsx$/i.test(filename)) {
          parserPlugins.push('typescript');
        }

        const result = await babelTransformAsync(String(source), {
          filename,
          sourceFileName: filename,
          sourceMaps: true,
          inputSourceMap,
          ast: false,
          babelrc: false,
          configFile: false,
          parserOpts: {
            plugins: parserPlugins,
          },
          presets: [[BABEL_PRESET_SOLID_PATH, solid]],
        });

        callback(null, result?.code ?? source, result?.map ?? inputSourceMap);
        return;
      }

      const result = await nativeTransformAsync(String(source), {
        ...solid,
        filename,
        sourceMap: true,
      } as NativeTransformOptions);

      callback(null, result.code, mergeSourceMaps(inputSourceMap, result.map));
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };

export default solidLoader;
