/**
 * modified from https://github.com/fz6m/lightningcss-loader
 * MIT License https://github.com/fz6m/lightningcss-loader/blob/main/LICENSE
 * Author @fz6m
 */
import { Buffer } from 'node:buffer';
import type { Rspack } from '@rsbuild/core';
import * as lightningcss from 'lightningcss';
import type { LightningCSSLoaderOptions } from './types';

async function LightningCSSLoader(
  this: Rspack.LoaderContext<LightningCSSLoaderOptions>,
  source: string,
  prevSourceMap?: Record<string, unknown>,
): Promise<void> {
  const done = this.async();
  const options = this.getOptions();
  const { implementation, targets, ...opts } = options;
  const transformFn = implementation?.transform ?? lightningcss.transform;

  try {
    const { code, map } = transformFn({
      filename: this.resourcePath,
      code: Buffer.from(source),
      sourceMap: this.sourceMap,
      targets,
      inputSourceMap:
        this.sourceMap && prevSourceMap
          ? JSON.stringify(prevSourceMap)
          : undefined,
      ...opts,
    });
    const codeAsString = code.toString();
    done(null, codeAsString, map && JSON.parse(map.toString()));
  } catch (error: unknown) {
    done(error as Error);
  }
}

export default LightningCSSLoader;
