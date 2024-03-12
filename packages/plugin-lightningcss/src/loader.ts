/**
 * modified from https://github.com/fz6m/lightningcss-loader
 * MIT License https://github.com/fz6m/lightningcss-loader/blob/main/LICENSE
 * Author @fz6m
 */
import type { LoaderContext } from '@rspack/core';
import { transform as _transform } from 'lightningcss';
import { Buffer } from 'node:buffer';
import type { LightningCSSLoaderOptions } from './types';

const LOADER_NAME = 'lightningcss-loader';

async function LightningCSSLoader(
  this: LoaderContext<LightningCSSLoaderOptions>,
  source: string,
  prevMap?: Record<string, any>,
): Promise<void> {
  const done = this.async();
  const options = this.getOptions();
  const { implementation, targets, ...opts } = options;

  if (
    implementation &&
    typeof (implementation as any).transform !== 'function'
  ) {
    done(
      new TypeError(
        `[${LOADER_NAME}]: options.implementation.transform must be an 'lightningcss' transform function. Received ${typeof (implementation as any).transform}`,
      ),
    );
    return;
  }

  const transform: typeof _transform =
    (implementation as any)?.transform ?? _transform;

  try {
    const { code, map } = transform({
      filename: this.resourcePath,
      code: Buffer.from(source),
      sourceMap: this.sourceMap,
      targets,
      inputSourceMap:
        this.sourceMap && prevMap ? JSON.stringify(prevMap) : undefined,
      ...opts,
    });
    const codeAsString = code.toString();
    done(null, codeAsString, map && JSON.parse(map.toString()));
  } catch (error: unknown) {
    done(error as Error);
  }
}

export default LightningCSSLoader;
