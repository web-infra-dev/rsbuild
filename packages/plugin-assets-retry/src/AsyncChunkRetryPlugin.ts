import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Rspack, rspack } from '@rsbuild/core';
import serialize from 'serialize-javascript';
import type { PluginAssetsRetryOptions, RuntimeRetryOptions } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://github.com/web-infra-dev/rspack/pull/5370
function appendWebpackScript(module: any, appendSource: string) {
  try {
    const originSource = module.getGeneratedCode();
    module.getGeneratedCode = () => `${originSource}\n${appendSource}`;
  } catch (err) {
    console.error('Failed to modify Webpack RuntimeModule');
    throw err;
  }
}

function appendRspackScript(
  module: any, // JsRuntimeModule type is not exported by rspack temporarily */
  appendSource: string,
) {
  try {
    const source = module.source.source.toString();
    module.source.source = Buffer.from(`${source}\n${appendSource}`, 'utf-8');
  } catch (err) {
    console.error('Failed to modify Rspack RuntimeModule');
    throw err;
  }
}

function pick<T, U extends keyof T>(obj: T, keys: ReadonlyArray<U>) {
  return keys.reduce(
    (ret, key) => {
      if (obj[key] !== undefined) {
        ret[key] = obj[key];
      }
      return ret;
    },
    {} as Pick<T, U>,
  );
}

class AsyncChunkRetryPlugin implements Rspack.RspackPluginInstance {
  readonly name = 'ASYNC_CHUNK_RETRY_PLUGIN';
  readonly options: PluginAssetsRetryOptions & { isRspack: boolean };
  readonly runtimeOptions: RuntimeRetryOptions;

  constructor(options: PluginAssetsRetryOptions & { isRspack: boolean }) {
    this.options = options;
    this.runtimeOptions = pick(options, [
      'domain',
      'max',
      'onRetry',
      'onSuccess',
      'onFail',
      'addQuery',
      'test',
    ]);
  }

  getRawRuntimeRetryCode(): string {
    const { RuntimeGlobals } = rspack;
    const filename = 'asyncChunkRetry';
    const runtimeFilePath = path.join(
      __dirname,
      'runtime',
      this.options.minify ? `${filename}.min.js` : `${filename}.js`,
    );
    const rawText = fs.readFileSync(runtimeFilePath, 'utf-8');

    return rawText
      .replaceAll('__RUNTIME_GLOBALS_REQUIRE__', RuntimeGlobals.require)
      .replaceAll(
        '__RUNTIME_GLOBALS_ENSURE_CHUNK__',
        RuntimeGlobals.ensureChunk,
      )
      .replaceAll(
        '__RUNTIME_GLOBALS_GET_CHUNK_SCRIPT_FILENAME__',
        RuntimeGlobals.getChunkScriptFilename,
      )
      .replaceAll(
        '__RUNTIME_GLOBALS_GET_CSS_FILENAME__',
        RuntimeGlobals.getChunkCssFilename,
      )
      .replaceAll(
        '__RUNTIME_GLOBALS_GET_MINI_CSS_EXTRACT_FILENAME__',
        '__webpack_require__.miniCssF',
      )
      .replaceAll('__RUNTIME_GLOBALS_PUBLIC_PATH__', RuntimeGlobals.publicPath)
      .replaceAll('__RUNTIME_GLOBALS_LOAD_SCRIPT__', RuntimeGlobals.loadScript)
      .replaceAll('__RETRY_OPTIONS__', serialize(this.runtimeOptions));
  }

  apply(compiler: Rspack.Compiler): void {
    compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
      compilation.hooks.runtimeModule.tap(this.name, (module) => {
        const { isRspack } = this.options;
        const constructorName = isRspack
          ? module.constructorName
          : module.constructor?.name;

        const isPublicPathModule =
          module.name === 'publicPath' ||
          constructorName === 'PublicPathRuntimeModule' ||
          constructorName === 'AutoPublicPathRuntimeModule';

        if (!isPublicPathModule) {
          return;
        }

        const runtimeCode = this.getRawRuntimeRetryCode();

        // Rspack currently does not have module.addRuntimeModule on the js side,
        // so we insert our runtime code after PublicPathRuntimeModule or AutoPublicPathRuntimeModule.
        if (isRspack) {
          appendRspackScript(module, runtimeCode);
        } else {
          appendWebpackScript(module, runtimeCode);
        }
      });
    });
  }
}

export { AsyncChunkRetryPlugin };
