import path from 'node:path';
import { isBuiltin, SourceMap, type SourceMapPayload } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { experiments } from '@rspack/core';
import type { IBasicRunnerOptions } from './basic';
import { color } from '../../helpers';
import {
  transformForTransformedEsm,
  type SwcTransform,
} from './transformedEsmTransform';
import type { Runner, RunnerRequirer } from './type';

type Namespace = Record<PropertyKey, unknown>;

type TransformedEsmImportMetadata = {
  importedNames?: string[];
};

type TransformedEsmImportMeta = {
  dirname: string;
  filename: string;
  glob: () => never;
  resolve: (specifier: string, parent?: string) => never;
  url: string;
};

type ModuleState = 'evaluating' | 'evaluated' | 'failed';

type ModuleNode = {
  error?: unknown;
  evaluationPromise?: Promise<Namespace>;
  explicitExports: Set<string>;
  exports: Namespace;
  id: string;
  mapErrorStack: (error: unknown) => void;
  state: ModuleState;
};

const TRANSFORMED_ESM_PARAMETERS = [
  '__rsbuild_ssr_import__',
  '__rsbuild_ssr_dynamic_import__',
  '__rsbuild_ssr_exports__',
  '__rsbuild_ssr_exportAll__',
  '__rsbuild_ssr_exportName__',
  '__rsbuild_ssr_import_meta__',
];

const AsyncFunction = async function () {}.constructor as new (
  ...parameters: string[]
) => (...args: unknown[]) => Promise<void>;

const INLINE_SOURCE_MAP =
  /(?:^|\r?\n)[\t ]*\/\/[#@][\t ]*sourceMappingURL=data:application\/json;base64,([^\s]+)[\t ]*$/;

const TRAILING_SOURCE_MAP_COMMENT =
  /(?:^|\r?\n)[\t ]*(?:\/\/[#@][\t ]*sourceMappingURL=(\S+)|\/\*[#@][\t ]*sourceMappingURL=([^*\s]+)[\t ]*\*\/)[\t ]*(?=\s*$)/;

const SOURCE_MAP_DATA_URL =
  /^data:application\/json(?:;charset=[^;,]+)?(?:(;base64))?,(.*)$/i;

const throwUnsupportedImportMetaMethod = (method: string): never => {
  throw new Error(
    `${color.dim('[rsbuild:runner]')} import.meta.${method}() is not supported.`,
  );
};

const createImportMeta = (moduleId: string): TransformedEsmImportMeta => ({
  dirname: path.dirname(moduleId),
  filename: moduleId,
  glob: () => throwUnsupportedImportMetaMethod('glob'),
  resolve: () => throwUnsupportedImportMetaMethod('resolve'),
  url: pathToFileURL(moduleId).href,
});

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createStackTraceMapper = (code: string, moduleId: string) => {
  const encodedSourceMap = INLINE_SOURCE_MAP.exec(code)?.[1];
  if (!encodedSourceMap) {
    return (_error: unknown): void => {};
  }

  let sourceMap: SourceMap;
  try {
    const payload = JSON.parse(
      Buffer.from(encodedSourceMap, 'base64').toString(),
    ) as SourceMapPayload;
    sourceMap = new SourceMap(payload);
  } catch {
    return (_error: unknown): void => {};
  }

  const moduleFrame = new RegExp(
    `${escapeRegExp(moduleId)}:(\\d+):(\\d+)`,
    'g',
  );
  return (error: unknown): void => {
    if (
      Error.prepareStackTrace === undefined ||
      !(error instanceof Error) ||
      !error.stack
    ) {
      return;
    }
    error.stack = error.stack.replace(moduleFrame, (frame, line, column) => {
      const origin = sourceMap.findOrigin(Number(line), Number(column));
      if (!('fileName' in origin)) {
        return frame;
      }
      return `${origin.fileName}:${origin.lineNumber}:${origin.columnNumber}`;
    });
  };
};

const createNamespace = (): Namespace => {
  const namespace = Object.create(null) as Namespace;
  Object.defineProperty(namespace, Symbol.toStringTag, {
    configurable: false,
    enumerable: false,
    value: 'Module',
  });
  return namespace;
};

const analyzeImportedModDifference = (
  namespace: Namespace,
  specifier: string,
  metadata?: TransformedEsmImportMetadata,
): void => {
  if (!metadata?.importedNames?.length) {
    return;
  }
  const missingBindings = metadata.importedNames.filter(
    (name) => !(name in namespace),
  );
  if (missingBindings.length > 0) {
    const lastBinding = missingBindings[missingBindings.length - 1];
    throw new SyntaxError(
      `${color.dim('[rsbuild:runner]')} The requested module '${specifier}' does not provide an export named '${lastBinding}'`,
    );
  }
};

class TransformedEsmEvaluator {
  readonly #bundleOutputRoot: string;
  readonly #isBundleOutput: IBasicRunnerOptions['isBundleOutput'];
  readonly #readFileSync: IBasicRunnerOptions['readFileSync'];
  readonly #modules = new Map<string, ModuleNode>();

  constructor(options: IBasicRunnerOptions) {
    this.#bundleOutputRoot = options.dist;
    this.#isBundleOutput = options.isBundleOutput;
    this.#readFileSync = options.readFileSync;
  }

  async evaluate(moduleId: string): Promise<Namespace> {
    const normalizedId = this.#normalizeBundleModuleId(moduleId);
    if (!this.#isBundleOutput(normalizedId)) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Unknown bundle module ${normalizedId}`,
      );
    }
    return this.#evaluateModule(this.#getModule(normalizedId), new Set());
  }

  #getModule(moduleId: string): ModuleNode {
    const existing = this.#modules.get(moduleId);
    if (existing?.state === 'failed') {
      this.#modules.delete(moduleId);
    } else if (existing) {
      return existing;
    }

    const moduleNode: ModuleNode = {
      explicitExports: new Set(),
      exports: createNamespace(),
      id: moduleId,
      mapErrorStack: () => {},
      state: 'evaluating',
    };
    this.#modules.set(moduleId, moduleNode);
    return moduleNode;
  }

  async #evaluateModule(
    moduleNode: ModuleNode,
    ancestors: Set<string>,
  ): Promise<Namespace> {
    if (moduleNode.state === 'evaluated') {
      return moduleNode.exports;
    }
    if (moduleNode.state === 'failed') {
      throw moduleNode.error;
    }
    if (moduleNode.evaluationPromise) {
      if (ancestors.has(moduleNode.id)) {
        return moduleNode.exports;
      }
      return moduleNode.evaluationPromise;
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(moduleNode.id);
    const evaluationPromise = this.#executeModule(moduleNode, nextAncestors)
      .then(() => {
        moduleNode.state = 'evaluated';
        return moduleNode.exports;
      })
      .catch((error) => {
        moduleNode.mapErrorStack(error);
        moduleNode.error = error;
        moduleNode.state = 'failed';
        this.#modules.delete(moduleNode.id);
        throw error;
      });
    moduleNode.evaluationPromise = evaluationPromise;
    return evaluationPromise;
  }

  async #executeModule(
    moduleNode: ModuleNode,
    ancestors: Set<string>,
  ): Promise<void> {
    const code = await this.#transformBundleModule(moduleNode.id);
    moduleNode.mapErrorStack = createStackTraceMapper(code, moduleNode.id);

    let execute: (...args: unknown[]) => Promise<void>;
    try {
      // rslint-disable-next-line @typescript-eslint/no-implied-eval
      execute = new AsyncFunction(...TRANSFORMED_ESM_PARAMETERS, code);
    } catch (error) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Failed to instantiate module-runner code for ${moduleNode.id}`,
        { cause: error },
      );
    }

    const exportName = (name: string, getter: () => unknown): void => {
      moduleNode.explicitExports.add(name);
      Object.defineProperty(moduleNode.exports, name, {
        configurable: true,
        enumerable: true,
        get: () => {
          try {
            return getter();
          } catch {
            return undefined;
          }
        },
      });
    };
    const exportAll = (namespace: Namespace): void => {
      for (const name of Object.keys(namespace)) {
        if (
          name === 'default' ||
          name === '__esModule' ||
          moduleNode.explicitExports.has(name) ||
          Object.hasOwn(moduleNode.exports, name)
        ) {
          continue;
        }
        Object.defineProperty(moduleNode.exports, name, {
          configurable: true,
          enumerable: true,
          get: () => namespace[name],
        });
      }
    };
    const staticImport = (
      specifier: string,
      metadata?: TransformedEsmImportMetadata,
    ) => this.#import(specifier, moduleNode.id, ancestors, metadata, true);
    const dynamicImport = (specifier: string) =>
      this.#import(specifier, moduleNode.id, ancestors, undefined, false);

    await execute(
      staticImport,
      dynamicImport,
      moduleNode.exports,
      exportAll,
      exportName,
      createImportMeta(moduleNode.id),
    );
  }

  async #transformBundleModule(moduleId: string): Promise<string> {
    const source = this.#readFileSync(moduleId);
    const match = TRAILING_SOURCE_MAP_COMMENT.exec(source);
    const sourceMapUrl = (match?.[1] ?? match?.[2])?.trim();

    let sourceMap: string | undefined;
    if (sourceMapUrl) {
      const dataUrlMatch = SOURCE_MAP_DATA_URL.exec(sourceMapUrl);
      if (dataUrlMatch) {
        sourceMap = dataUrlMatch[1]
          ? Buffer.from(dataUrlMatch[2], 'base64').toString()
          : decodeURIComponent(dataUrlMatch[2]);
      } else {
        const resolvedUrl = new URL(sourceMapUrl, pathToFileURL(moduleId));
        if (resolvedUrl.protocol === 'file:') {
          sourceMap = this.#readFileSync(fileURLToPath(resolvedUrl));
        }
      }
    }

    return transformForTransformedEsm(
      { path: moduleId, source, sourceMap },
      experiments.swc.transform as SwcTransform,
    );
  }

  async #import(
    specifier: string,
    importer: string,
    ancestors: Set<string>,
    metadata: TransformedEsmImportMetadata | undefined,
    validate: boolean,
  ): Promise<Namespace> {
    if (typeof specifier !== 'string') {
      throw new TypeError(
        `${color.dim('[rsbuild:runner]')} Module specifier must be a string`,
      );
    }

    const bundleModuleId = this.#resolveBundleModuleId(specifier, importer);
    if (bundleModuleId) {
      const dependency = this.#getModule(bundleModuleId);
      const isCycle =
        dependency.state !== 'evaluated' && ancestors.has(dependency.id);
      const namespace = isCycle
        ? dependency.exports
        : await this.#evaluateModule(dependency, ancestors);
      if (validate) {
        analyzeImportedModDifference(namespace, specifier, metadata);
      }
      return namespace;
    }

    const namespace = await this.#runExternalModule(specifier, importer);
    if (validate) {
      analyzeImportedModDifference(namespace, specifier, metadata);
    }
    return namespace;
  }

  #resolveBundleModuleId(
    specifier: string,
    importer: string,
  ): string | undefined {
    const request = specifier.split(/[?#]/, 1)[0].replaceAll('\\', '/');
    if (request.startsWith('file:')) {
      const resolved = fileURLToPath(request);
      return this.#isBundleOutput(resolved) ? resolved : undefined;
    }
    if (request.startsWith('.')) {
      const resolved = path.resolve(path.dirname(importer), request);
      return this.#isBundleOutput(resolved) ? resolved : undefined;
    }
    const candidate = path.isAbsolute(request)
      ? path.normalize(request)
      : path.resolve(this.#bundleOutputRoot, request);
    return this.#isBundleOutput(candidate) ? candidate : undefined;
  }

  #normalizeBundleModuleId(moduleId: string): string {
    if (!path.isAbsolute(moduleId)) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Bundle module ID must be absolute: ${moduleId}`,
      );
    }
    const normalized = path.normalize(moduleId);
    const relative = path.relative(this.#bundleOutputRoot, normalized);
    if (
      !relative ||
      path.isAbsolute(relative) ||
      relative === '..' ||
      relative.startsWith(`..${path.sep}`)
    ) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Bundle module is outside the output root: ${moduleId}`,
      );
    }
    return normalized;
  }

  #resolveExternalModuleId(specifier: string, importer: string): string {
    if (isBuiltin(specifier)) {
      return specifier;
    }
    if (path.isAbsolute(specifier)) {
      return pathToFileURL(specifier).href;
    }
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(specifier)) {
      return specifier;
    }

    const result = new experiments.resolver.ResolverFactory({
      conditionNames: ['node', 'import', 'default'],
      mainFields: ['module', 'main'],
    }).sync(path.dirname(importer), specifier);
    if (!result.path) {
      throw new Error(
        `${color.dim('[rsbuild:runner]')} Cannot resolve external module '${specifier}' imported from ${importer}: ${result.error}`,
      );
    }
    return pathToFileURL(result.path).href;
  }

  #runExternalModule(specifier: string, importer: string): Promise<Namespace> {
    return import(
      this.#resolveExternalModuleId(specifier, importer)
    ) as Promise<Namespace>;
  }
}

export class TransformedEsmRunner implements Runner {
  readonly #options: IBasicRunnerOptions;
  readonly #evaluator: TransformedEsmEvaluator;

  constructor(options: IBasicRunnerOptions) {
    this.#options = options;
    this.#evaluator = new TransformedEsmEvaluator(options);
  }

  async run(file: string): Promise<unknown> {
    return await this.getRequire()(this.#options.dist, file);
  }

  getRequire(): RunnerRequirer {
    return (currentDirectory, modulePath) => {
      if (Array.isArray(modulePath)) {
        throw new Error(
          `${color.dim('[rsbuild:runner]')} Array require is not supported by the module runner.`,
        );
      }
      const request = modulePath.split('?', 1)[0];
      const absolutePath = path.isAbsolute(request)
        ? request
        : request.startsWith('.')
          ? path.resolve(currentDirectory, request)
          : path.resolve(this.#options.dist, request);
      return this.#evaluator.evaluate(absolutePath).then((namespace) => {
        const defaultValue = namespace.default;
        return defaultValue instanceof Promise ? defaultValue : namespace;
      });
    };
  }
}
