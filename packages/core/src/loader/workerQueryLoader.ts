import path from 'node:path';
import type {
  Compilation,
  LoaderContext,
  LoaderDefinition,
} from '@rspack/core';

const INLINE_QUERY_REGEX = /[?&]inline(?:&|=|$)/;
const JS_FILE_REGEX = /\.m?js(?:\?.*)?$/;
const HASH_PLACEHOLDER_REGEX =
  /\[(?:[^:\]]+:)?(?:chunkhash|contenthash|hash|fullhash)(?::[^\]]+)?]/i;
const SOURCE_MAPPING_URL_REGEX =
  /(?:\/\*# sourceMappingURL=.*?\*\/|\/\/# sourceMappingURL=.*)$/gm;

type WorkerQueryLoaderOptions = {
  name?: string;
};

const normalizePath = (value: string) => value.replace(/\\/g, '/');

const toWorkerRequest = (resourcePath: string) =>
  `./${normalizePath(path.basename(resourcePath))}`;

const getWorkerOptionsCode = (isModule: boolean) => `{
  ${isModule ? 'type: "module",' : ''}
  name: options && options.name
}`;

const getWorkerWrapper = ({
  resourcePath,
  isModule,
}: {
  resourcePath: string;
  isModule: boolean;
}) => {
  const workerRequest = toWorkerRequest(resourcePath);
  const workerOptions = getWorkerOptionsCode(isModule);

  return `export default function WorkerWrapper(options) {
  return new Worker(new URL(${JSON.stringify(workerRequest)}, import.meta.url), ${workerOptions});
}`;
};

const stripSourceMappingURL = (source: string) =>
  source.replace(SOURCE_MAPPING_URL_REGEX, '');

const getInlineWorkerWrapper = ({
  source,
  isModule,
}: {
  source: string;
  isModule: boolean;
}) => {
  const workerOptions = getWorkerOptionsCode(isModule);
  const revokeCode = isModule
    ? 'URL.revokeObjectURL(import.meta.url);'
    : '(self.URL || self.webkitURL).revokeObjectURL(self.location.href);';

  return `const jsContent = ${JSON.stringify(stripSourceMappingURL(source))};
const blob = typeof self !== "undefined" && self.Blob && new Blob([${JSON.stringify(
    revokeCode,
  )}, jsContent], { type: "text/javascript;charset=utf-8" });

export default function WorkerWrapper(options) {
  let objURL;
  try {
    objURL = blob && (self.URL || self.webkitURL).createObjectURL(blob);
    if (!objURL) throw "";
    const worker = new Worker(objURL, ${workerOptions});
    worker.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(objURL);
    });
    return worker;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(jsContent),
      ${workerOptions}
    );
  }
}`;
};

const getChildFilename = (
  filename: Compilation['outputOptions']['filename'],
): string => {
  if (typeof filename !== 'string') {
    return 'static/js/[name].worker.js';
  }

  return HASH_PLACEHOLDER_REGEX.test(filename)
    ? filename
    : filename.replace(/\.js(?:\?.*)?$/i, '.worker.js');
};

const getChildChunkFilename = (
  chunkFilename: Compilation['outputOptions']['chunkFilename'],
): string => {
  if (typeof chunkFilename !== 'string') {
    return 'static/js/async/[name].worker.js';
  }

  return HASH_PLACEHOLDER_REGEX.test(chunkFilename)
    ? chunkFilename
    : chunkFilename.replace(/\.js(?:\?.*)?$/i, '.worker.js');
};

const deleteAsset = (compilation: Compilation, filename: string) => {
  if (compilation.getAsset(filename)) {
    compilation.deleteAsset(filename);
  }
};

const getCompilerPlugin = <T>(getPlugin: () => T): T => {
  const plugin = getPlugin();
  if (!plugin) {
    throw new Error(
      '[rsbuild:worker] The current Rspack version does not support inline worker compilation.',
    );
  }
  return plugin;
};

const compileInlineWorker = (
  loaderContext: LoaderContext<WorkerQueryLoaderOptions>,
): Promise<string> => {
  const callbackCompiler = loaderContext._compiler;
  const compilation = loaderContext._compilation;
  const rspack = callbackCompiler.webpack;
  const outputOptions = compilation.outputOptions;
  const compilerName = `rsbuild-worker ${loaderContext.resourcePath}`;

  const childCompiler = compilation.createChildCompiler(
    compilerName,
    {
      filename: getChildFilename(outputOptions.filename),
      chunkFilename: getChildChunkFilename(outputOptions.chunkFilename),
      publicPath: outputOptions.publicPath,
      globalObject: 'self',
      module: outputOptions.module,
      chunkFormat: outputOptions.module ? 'module' : undefined,
      chunkLoading: outputOptions.module ? 'import' : undefined,
      workerChunkLoading: outputOptions.workerChunkLoading,
      wasmLoading: outputOptions.wasmLoading,
      workerWasmLoading: outputOptions.workerWasmLoading,
    } as Compilation['outputOptions'],
    [],
  );

  new (getCompilerPlugin(
    () => rspack.webworker.WebWorkerTemplatePlugin,
  ))().apply(childCompiler);

  new rspack.LoaderTargetPlugin('webworker').apply(childCompiler);

  new rspack.EntryPlugin(
    loaderContext.context ?? path.dirname(loaderContext.resourcePath),
    loaderContext.resourcePath,
    path.parse(loaderContext.resourcePath).name,
  ).apply(childCompiler);

  return new Promise((resolve, reject) => {
    childCompiler.runAsChild((error, entries, childCompilation) => {
      if (error) {
        reject(error);
        return;
      }

      const entry = entries?.[0];
      if (!entry || !childCompilation) {
        reject(
          new Error(
            `[rsbuild:worker] Failed to compile inline worker "${loaderContext.resourcePath}".`,
          ),
        );
        return;
      }

      const files = [...entry.files];
      const jsFiles = files.filter((file) => JS_FILE_REGEX.test(file));
      const workerFilename = jsFiles[0];

      if (!workerFilename) {
        reject(
          new Error(
            `[rsbuild:worker] Failed to find the inline worker output for "${loaderContext.resourcePath}".`,
          ),
        );
        return;
      }

      const extraJsFiles = childCompilation
        .getAssets()
        .map((asset) => asset.name)
        .filter((file) => file !== workerFilename && JS_FILE_REGEX.test(file));
      if (extraJsFiles.length > 0) {
        reject(
          new Error(
            `[rsbuild:worker] Inline workers do not support code splitting yet. Use ?worker instead, or remove dynamic imports from "${loaderContext.resourcePath}".`,
          ),
        );
        return;
      }

      const asset = childCompilation.getAsset(workerFilename);
      if (!asset) {
        reject(
          new Error(
            `[rsbuild:worker] Failed to read the inline worker output "${workerFilename}".`,
          ),
        );
        return;
      }

      deleteAsset(compilation, workerFilename);
      deleteAsset(compilation, `${workerFilename}.map`);

      for (const file of childCompilation.fileDependencies) {
        loaderContext.addDependency(file);
      }
      for (const context of childCompilation.contextDependencies) {
        loaderContext.addContextDependency(context);
      }
      for (const missing of childCompilation.missingDependencies) {
        loaderContext.addMissingDependency(missing);
      }

      resolve(asset.source.source().toString());
    });
  });
};

const workerQueryLoader: LoaderDefinition<WorkerQueryLoaderOptions> =
  async function workerQueryLoader(): Promise<void> {
    const callback = this.async();
    const isModule = Boolean(this._compilation.outputOptions.module);

    try {
      if (!INLINE_QUERY_REGEX.test(this.resourceQuery)) {
        callback(
          null,
          getWorkerWrapper({ resourcePath: this.resourcePath, isModule }),
        );
        return;
      }

      const source = await compileInlineWorker(this);
      callback(null, getInlineWorkerWrapper({ source, isModule }));
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  };

export default workerQueryLoader;
