import { fse, pick } from '@rsbuild/shared';
import { Rspack } from '@rsbuild/shared/rspack';
import path from 'node:path';
import type { PluginAssetsRetryOptions, RuntimeRetryOptions } from './types';
import serialize from 'serialize-javascript';

const { RuntimeGlobals } = Rspack;

function appendWebpackScript(module: any, appendSource: string) {
  try {
    const originSource = module.getGeneratedCode();
    module.getGeneratedCode = () => `${originSource}\n${appendSource}`;
  } catch (err) {
    console.error('Failed to modify Webpack RuntimeModule', err);
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
    console.error('Failed to modify Rspack RuntimeModule', err);
    throw err;
  }
}

class AsyncChunkRetryPlugin implements Rspack.RspackPluginInstance {
  readonly name = 'ASYNC_CHUNK_RETRY_PLUGIN';
  readonly options: PluginAssetsRetryOptions & { isRspack?: boolean };
  readonly runtimeOptions: RuntimeRetryOptions;

  constructor(options: PluginAssetsRetryOptions & { isRspack?: boolean }) {
    this.options = options;
    this.runtimeOptions = pick(options, [
      'domain',
      'max',
      'onRetry',
      'onSuccess',
      'onFail',
      'test',
    ]);
  }

  getRawRuntimeRetryCode() {
    const filename = 'asyncChunkRetry';
    const minify =
      this.options?.minify ?? process.env.NODE_ENV === 'production';
    const runtimeFilePath = path.join(
      __dirname,
      'runtime',
      minify ? `${filename}.min.js` : `${filename}.js`,
    );
    const rawText = fse.readFileSync(runtimeFilePath, 'utf-8');

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
      .replaceAll('__RUNTIME_GLOBALS_PUBLIC_PATH__', RuntimeGlobals.publicPath)
      .replaceAll('__RUNTIME_GLOBALS_LOAD_SCRIPT__', RuntimeGlobals.loadScript)
      .replaceAll('__RETRY_OPTIONS__', serialize(this.runtimeOptions));
  }

  apply(compiler: Rspack.Compiler) {
    compiler.hooks.thisCompilation.tap(this.name, (compilation) => {
      compilation.hooks.runtimeModule.tap(this.name, (module, _chunk) => {
        // Rspack currently does not have module.addRuntimeModule on the js side, so we insert our runtime code after PublicPathRuntimeModule
        if (module.constructorName === 'PublicPathRuntimeModule') {
          const runtimeCode = this.getRawRuntimeRetryCode();
          if (this.options.isRspack === false) {
            appendWebpackScript(module, runtimeCode);
          } else {
            appendRspackScript(module, runtimeCode);
          }
        }
      });
    });
  }
}

export { AsyncChunkRetryPlugin };
